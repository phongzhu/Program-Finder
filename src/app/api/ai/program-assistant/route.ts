import { NextRequest, NextResponse } from "next/server";
import { GROQ_MODEL, getGroqClient } from "lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanProgram(program: any) {
  return {
    id: program?.id,
    title: program?.title,
    description: program?.description,
    objective: program?.objective,
    benefits: program?.benefits,
    program_type: program?.program_type,
    status: program?.status,
    application_start_date: program?.application_start_date,
    application_end_date: program?.application_end_date,
    slot_count: program?.slot_count,
    municipality: program?.ref_municipalities?.municipality_name,
    barangay: program?.ref_barangays?.barangay_name,
    office: program?.offices?.office_name,
    category: program?.program_categories?.category_name,
    eligibility_rules: program?.program_eligibility_rules || null,
    requirements: program?.program_requirements || [],
  };
}

function cleanApplicant(applicant: any) {
  if (!applicant) return null;

  return {
    profile: applicant.profile || applicant.profiles || applicant,
    address: applicant.user_addresses || applicant.address || null,
    applicant_profile:
      applicant.applicant_profiles || applicant.applicant_profile || null,
    household:
      applicant.applicant_household_info || applicant.household || null,
    special_categories:
      applicant.applicant_special_categories ||
      applicant.special_categories ||
      null,
    student:
      applicant.applicant_student_info || applicant.student || null,
    family_members:
      applicant.applicant_family_members || applicant.family_members || [],
    sector_tags:
      applicant.applicant_sector_tags || applicant.sector_tags || [],
  };
}

function extractStatusCode(error: any) {
  const candidates = [
    error?.status,
    error?.statusCode,
    error?.response?.status,
    error?.cause?.status,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed >= 400 && parsed <= 599) {
      return parsed;
    }
  }

  return 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetryGroq(error: any) {
  return extractStatusCode(error) === 503;
}

function describeGroqError(error: any) {
  return {
    status: extractStatusCode(error),
    message: error?.message || String(error),
    stack: error?.stack,
    name: error?.name,
    code: error?.code,
    type: error?.type,
    cause: error?.cause,
    response: error?.response,
  };
}

async function generateGroqWithRetry(ai: any, requestConfig: any) {
  try {
    return await ai.chat.completions.create(requestConfig);
  } catch (firstError: any) {
    if (!shouldRetryGroq(firstError)) {
      throw firstError;
    }

    console.warn(
      "Groq returned 503. Retrying once.",
      describeGroqError(firstError)
    );
    await sleep(700);
    return ai.chat.completions.create(requestConfig);
  }
}

function normalizeAssistantAnswer(answer: unknown) {
  return String(answer || "")
    .replace(/\r/g, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[\*\-]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const AI_OVERVIEW_FINAL_NOTE =
  "Final approval is handled by authorized staff after review.";

function toStringList(value: unknown) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeOverviewPayload(overview: any) {
  return {
    summary: String(overview?.summary || "").trim(),
    recommendedPrograms: (Array.isArray(overview?.recommendedPrograms)
      ? overview.recommendedPrograms
      : []
    )
      .map((program: any) => ({
        title: String(program?.title || "").trim(),
        reason: String(program?.reason || "").trim(),
        matchedCriteria: toStringList(program?.matchedCriteria),
        missingDetails: toStringList(program?.missingDetails),
        requiredDocuments: toStringList(program?.requiredDocuments),
      }))
      .filter((program: any) => program.title),
    notRecommendedPrograms: (Array.isArray(overview?.notRecommendedPrograms)
      ? overview.notRecommendedPrograms
      : []
    )
      .map((program: any) => ({
        title: String(program?.title || "").trim(),
        reason: String(program?.reason || "").trim(),
      }))
      .filter((program: any) => program.title),
    finalNote:
      String(overview?.finalNote || AI_OVERVIEW_FINAL_NOTE).trim() ||
      AI_OVERVIEW_FINAL_NOTE,
  };
}

function parseOverviewResponse(rawText: unknown) {
  const text = String(rawText || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!text) {
    return null;
  }

  try {
    return normalizeOverviewPayload(JSON.parse(text));
  } catch (_error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode === "overview" ? "overview" : "chat";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message && mode !== "overview") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const applicant = cleanApplicant(body.applicant);
    const programs = Array.isArray(body.programs)
      ? body.programs.map(cleanProgram)
      : [];

    const ai = getGroqClient();

    const systemInstruction = `
You are ProgramFinder AI Assistant.

Your job:
- Help applicants understand available programs.
- Recommend programs only from the provided program list.
- Explain eligibility in simple language.
- Explain missing applicant details.
- Explain missing requirements.
- Explain why a program may or may not match.

Rules:
- Use only the database context provided.
- Do not invent programs.
- Do not invent requirements.
- Do not say the applicant is officially approved.
- Do not say the applicant is officially rejected.
- Always mention that final approval is handled by authorized staff.
- If applicant details are missing, clearly list what details are needed.
- If no programs are provided, say there are no visible programs to analyze.

Response format rules:
- Output plain text only.
- Do not use markdown symbols such as **, #, or ---.
- Keep the reply concise and easy to scan.
- Use this structure in order:
  1) Greeting with applicant first name if available.
  2) "Programs you may match"
  3) Numbered program list.
  4) For each program use labels exactly:
     Program:
     Category:
     Why you match:
     Missing details:
     Requirements:
  5) "Programs you may not match yet" with brief reasons.
  6) One-line reminder that final approval is handled by authorized staff.
`;

    const prompt = `
Applicant message:
${message}

Applicant context:
${JSON.stringify(applicant, null, 2)}

Visible programs on the current page:
${JSON.stringify(programs, null, 2)}

Answer the applicant based only on the visible programs and applicant context.
`;

    console.log("ProgramFinder AI request:", {
      mode,
      model: GROQ_MODEL,
      message,
      programCount: programs.length,
      hasApplicantContext: Boolean(applicant),
    });

    if (mode === "overview") {
      const searchQuery =
        typeof body.searchQuery === "string" ? body.searchQuery.trim() : "";
      const noExactMatch = Boolean(body.noExactMatch);
      const applicantSurvey = body.applicantSurvey || null;
      const overviewSystemInstruction = `
You are ProgramFinder AI Overview.

Your job:
- Analyze the applicant and visible programs.
- Recommend only from visible programs.
- Explain matches and non-matches using program data and applicant data only.
- Do not invent programs, requirements, or applicant details.

Special rule:
- If no exact search matches were found, start summary with exactly:
  "No exact search match, but here are related programs."

Return exactly one valid JSON object only.
Do not return markdown.
Do not return code fences.
Do not return any extra text.

Use this exact JSON shape:
{
  "summary": "",
  "recommendedPrograms": [
    {
      "title": "",
      "reason": "",
      "matchedCriteria": [],
      "missingDetails": [],
      "requiredDocuments": []
    }
  ],
  "notRecommendedPrograms": [
    {
      "title": "",
      "reason": ""
    }
  ],
  "finalNote": "${AI_OVERVIEW_FINAL_NOTE}"
}
`;

      const overviewPrompt = `
Search query:
${searchQuery || "(none)"}

Applicant message:
${message || "(none)"}

Applicant context:
${JSON.stringify(applicant, null, 2)}

Applicant survey:
${JSON.stringify(applicantSurvey, null, 2)}

No exact search match:
${noExactMatch ? "yes" : "no"}

Visible programs:
${JSON.stringify(programs, null, 2)}

Output only the required JSON object.
`;

      const overviewResponse = await generateGroqWithRetry(ai, {
        model: GROQ_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: overviewSystemInstruction,
          },
          {
            role: "user",
            content: overviewPrompt,
          },
        ],
      });

      const overview = parseOverviewResponse(
        overviewResponse?.choices?.[0]?.message?.content
      );

      if (!overview) {
        console.error("Groq returned invalid overview JSON:", overviewResponse);
        return NextResponse.json(
          {
            error: "AI overview returned invalid response.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        overview,
      });
    }

    const response = await generateGroqWithRetry(ai, {
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = normalizeAssistantAnswer(
      response?.choices?.[0]?.message?.content
    );

    if (!answer) {
      console.error("Groq returned empty response:", response);

      return NextResponse.json(
        {
          error: "Groq returned an empty response.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error: any) {
    console.error(
      "Groq Program Assistant Error:",
      describeGroqError(error)
    );
    const statusCode = extractStatusCode(error);

    return NextResponse.json(
      {
        error: "Unable to generate an AI response right now.",
      },
      { status: statusCode }
    );
  }
}
