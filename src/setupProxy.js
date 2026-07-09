const express = require('express');
const OpenAI = require('openai');

const GROQ_MODEL =
  process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_KEY_ENV_NAMES = ['GROQ_API_KEY'];

function resolveGroqApiKey() {
  for (const envName of GROQ_KEY_ENV_NAMES) {
    const rawValue = process.env[envName];

    if (!rawValue) continue;

    const normalized = String(rawValue).trim().replace(/^["']|["']$/g, '');

    if (!normalized) continue;

    return normalized;
  }

  return '';
}

function getGroqClient() {
  const apiKey = resolveGroqApiKey();

  if (!apiKey) {
    throw new Error(
      `Missing Groq API key. Set one of ${GROQ_KEY_ENV_NAMES.join(
        ', '
      )} in .env.local, then restart the dev server.`
    );
  }

  if (!/^gsk_[0-9A-Za-z]{20,}/.test(apiKey)) {
    throw new Error(
      'Groq API key format looks invalid. Paste the key exactly from your Groq dashboard without quotes or extra spaces.'
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
}

function cleanProgram(program) {
  return {
    id: program?.id,
    title: program?.title,
    description: program?.description || program?.summary,
    objective: program?.objective,
    benefits: program?.benefits,
    program_type: program?.program_type || program?.programType,
    status: program?.status,
    application_start_date:
      program?.application_start_date || program?.applicationStartDate,
    application_end_date:
      program?.application_end_date || program?.applicationEndDate,
    slot_count: program?.slot_count || program?.maxBeneficiaries || program?.slots,
    municipality:
      program?.ref_municipalities?.municipality_name || program?.municipality,
    barangay: program?.ref_barangays?.barangay_name || program?.barangay,
    office: program?.offices?.office_name || program?.office,
    category: program?.program_categories?.category_name || program?.category,
    eligibility_rules:
      program?.program_eligibility_rules || program?.eligibility_rules || program?.eligibilityRules || null,
    requirements:
      program?.program_requirements || program?.requirements || program?.requirementRecords || [],
  };
}

function cleanApplicant(applicant) {
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

function extractStatusCode(error) {
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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetryGroq(error) {
  return extractStatusCode(error) === 503;
}

function describeGroqError(error) {
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

async function generateGroqWithRetry(ai, requestConfig) {
  try {
    return await ai.chat.completions.create(requestConfig);
  } catch (firstError) {
    if (!shouldRetryGroq(firstError)) {
      throw firstError;
    }

    console.warn('Groq returned 503. Retrying once.', describeGroqError(firstError));
    await sleep(700);
    return ai.chat.completions.create(requestConfig);
  }
}

function normalizeAssistantAnswer(answer) {
  return String(answer || '')
    .replace(/\r/g, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*[\*\-]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const AI_OVERVIEW_FINAL_NOTE =
  'Final approval is handled by authorized staff after review.';

function toStringList(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeOverviewPayload(overview) {
  return {
    summary: String(overview?.summary || '').trim(),
    recommendedPrograms: (Array.isArray(overview?.recommendedPrograms)
      ? overview.recommendedPrograms
      : []
    )
      .map((program) => ({
        title: String(program?.title || '').trim(),
        reason: String(program?.reason || '').trim(),
        matchedCriteria: toStringList(program?.matchedCriteria),
        missingDetails: toStringList(program?.missingDetails),
        requiredDocuments: toStringList(program?.requiredDocuments),
      }))
      .filter((program) => program.title),
    notRecommendedPrograms: (Array.isArray(overview?.notRecommendedPrograms)
      ? overview.notRecommendedPrograms
      : []
    )
      .map((program) => ({
        title: String(program?.title || '').trim(),
        reason: String(program?.reason || '').trim(),
      }))
      .filter((program) => program.title),
    finalNote:
      String(overview?.finalNote || AI_OVERVIEW_FINAL_NOTE).trim() ||
      AI_OVERVIEW_FINAL_NOTE,
  };
}

function parseOverviewResponse(rawText) {
  const text = String(rawText || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
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

function normalizeDocumentPrecheckResult(rawResult) {
  const warnings = Array.isArray(rawResult?.warnings)
    ? rawResult.warnings.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const confidence = String(rawResult?.confidence || '').trim().toLowerCase();

  return {
    appearsCorrectType: Boolean(rawResult?.appearsCorrectType),
    confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'low',
    detectedDocumentType: String(rawResult?.detectedDocumentType || '').trim(),
    warnings,
    suggestedAction: String(rawResult?.suggestedAction || '').trim(),
  };
}

function parseDocumentPrecheckResponse(rawText) {
  const text = String(rawText || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  if (!text) {
    return null;
  }

  try {
    return normalizeDocumentPrecheckResult(JSON.parse(text));
  } catch (_error) {
    return null;
  }
}

module.exports = function registerProgramFinderAIApi(app) {
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/ai/program-assistant', async (req, res) => {
    try {
      const body = req.body || {};
      const mode = body.mode === 'overview' ? 'overview' : 'chat';

      const message =
        typeof body.message === 'string' ? body.message.trim() : '';

      if (!message && mode !== 'overview') {
        return res.status(400).json({ error: 'Message is required.' });
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

      console.log('ProgramFinder AI request:', {
        mode,
        model: GROQ_MODEL,
        message,
        programCount: programs.length,
        hasApplicantContext: Boolean(applicant),
      });

      if (mode === 'overview') {
        const searchQuery =
          typeof body.searchQuery === 'string' ? body.searchQuery.trim() : '';
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
${searchQuery || '(none)'}

Applicant message:
${message || '(none)'}

Applicant context:
${JSON.stringify(applicant, null, 2)}

Applicant survey:
${JSON.stringify(applicantSurvey, null, 2)}

No exact search match:
${noExactMatch ? 'yes' : 'no'}

Visible programs:
${JSON.stringify(programs, null, 2)}

Output only the required JSON object.
`;

        const overviewResponse = await generateGroqWithRetry(ai, {
          model: GROQ_MODEL,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: overviewSystemInstruction,
            },
            {
              role: 'user',
              content: overviewPrompt,
            },
          ],
        });

        const overview = parseOverviewResponse(
          overviewResponse?.choices?.[0]?.message?.content
        );

        if (!overview) {
          console.error('Groq returned invalid overview JSON:', overviewResponse);
          return res.status(500).json({
            error: 'AI overview returned invalid response.',
          });
        }

        return res.json({ overview });
      }

      const response = await generateGroqWithRetry(ai, {
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: systemInstruction,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const answer = normalizeAssistantAnswer(
        response?.choices?.[0]?.message?.content
      );

      if (!answer) {
        console.error('Groq returned empty response:', response);

        return res.status(500).json({
          error: 'Groq returned an empty response.',
        });
      }

      return res.json({ answer });
    } catch (error) {
      console.error('Groq Program Assistant Error:', describeGroqError(error));
      const statusCode = extractStatusCode(error);

      return res.status(statusCode).json({
        error: 'Unable to generate an AI response right now.',
      });
    }
  });

  app.post('/api/ai/document-precheck', async (req, res) => {
    try {
      const body = req.body || {};
      const expectedDocumentType = String(body.expectedDocumentType || '').trim();
      const requirementName = String(body.requirementName || '').trim();
      const requirementDescription = String(body.requirementDescription || '').trim();
      const applicantName = String(body.applicantName || '').trim();
      const fileName = String(body.fileName || '').trim();
      const fileMimeType = String(body.fileMimeType || '').trim().toLowerCase();
      const fileUrl = String(body.fileUrl || '').trim();

      if (!expectedDocumentType || !requirementName) {
        return res.status(400).json({ error: 'expectedDocumentType and requirementName are required.' });
      }

      const ai = getGroqClient();
      const canInspectImage = Boolean(fileUrl && fileMimeType.startsWith('image/'));

      const systemInstruction = `
You are ProgramFinder AI Document Pre-check.

Task:
- Evaluate whether an uploaded applicant file appears to match the expected document requirement.
- This is only a guidance pre-check and never an approval.
- If file image is blurry, unreadable, cropped, too dark, or unclear, add a warning mentioning it.

Document type guide:
- valid_id: ID card or government ID with name/photo/ID layout
- residency_certificate: proof showing residence/address
- barangay_certificate: barangay-issued certificate
- barangay_clearance: barangay clearance document
- birth_certificate: birth certificate or civil registry document
- school_id: student ID card with school/name/photo
- registration_form: enrollment or registration form
- medical_certificate: medical certificate from clinic/doctor/hospital

Return exactly one valid JSON object only:
{
  "appearsCorrectType": true,
  "confidence": "high",
  "detectedDocumentType": "school_id",
  "warnings": [],
  "suggestedAction": "File appears to match the required document type."
}

Rules:
- Do not include markdown.
- Do not include any text outside JSON.
- If inspection is not possible, set appearsCorrectType false, confidence low, and explain in warnings/suggestedAction.
`;

      const promptText = `
Expected document type: ${expectedDocumentType}
Requirement name: ${requirementName}
Requirement description: ${requirementDescription || '(none provided)'}
Applicant name: ${applicantName || '(not provided)'}
File name: ${fileName || '(not provided)'}
File MIME type: ${fileMimeType || '(not provided)'}

Analyze this upload and return only the required JSON object.
`;

      const userContent = canInspectImage
        ? [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: fileUrl } },
          ]
        : promptText;

      const response = await generateGroqWithRetry(ai, {
        model: GROQ_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent },
        ],
      });

      const result = parseDocumentPrecheckResponse(
        response?.choices?.[0]?.message?.content
      );

      if (!result) {
        console.error('Groq returned invalid document pre-check JSON:', response);
        return res.status(500).json({
          error: 'AI document pre-check returned invalid response.',
        });
      }

      return res.json({ result });
    } catch (error) {
      console.error('Groq Document Pre-check Error:', describeGroqError(error));
      const statusCode = extractStatusCode(error);

      return res.status(statusCode).json({
        error: 'Unable to run AI document pre-check right now.',
      });
    }
  });
};
