export type DocumentTypeKey = string;

export interface RequirementTemplateAcceptedDocumentType {
  id: string;
  requirement_template_id: string;
  document_type: DocumentTypeKey;
  created_at: string;
}

export interface ProgramRequirementAcceptedDocumentType {
  id: string;
  program_requirement_id: string;
  document_type: DocumentTypeKey;
  created_at: string;
}

export interface RequirementTemplateRecord {
  id: string;
  requirementName: string;
  expectedDocumentType?: DocumentTypeKey | '';
  acceptedDocumentTypes?: DocumentTypeKey[];
  accepted_document_types?: DocumentTypeKey[];
}

export interface ProgramRequirementRecord {
  id: string;
  requirementName: string;
  requirementTemplateId?: string | null;
  acceptedDocumentTypes?: DocumentTypeKey[];
  accepted_document_types?: DocumentTypeKey[];
}
