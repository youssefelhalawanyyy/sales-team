export const PIPELINE_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'gray', label: 'Gray' }
];

export const PIPELINE_COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200'
};

export const PIPELINE_FIELD_OPTIONS = [
  { value: 'businessName', label: 'Business Name' },
  { value: 'contactPerson', label: 'Contact Person' },
  { value: 'phoneNumber', label: 'Phone Number' },
  { value: 'price', label: 'Deal Value' },
  { value: 'notes', label: 'Notes' },
  { value: 'lossReason', label: 'Loss Reason' }
];

export const PIPELINE_FIELD_LABELS = PIPELINE_FIELD_OPTIONS.reduce((acc, field) => {
  acc[field.value] = field.label;
  return acc;
}, {});

export const PIPELINE_RESERVED_VALUES = ['closed', 'lost'];

export const DEFAULT_PIPELINE_STAGES = [
  {
    value: 'potential_client',
    label: 'Potential Client',
    color: 'blue',
    requiredFields: ['businessName', 'contactPerson', 'phoneNumber']
  },
  {
    value: 'pending_approval',
    label: 'Pending Approval',
    color: 'yellow',
    requiredFields: ['businessName', 'contactPerson', 'phoneNumber']
  },
  {
    value: 'closed',
    label: 'Closed',
    color: 'green',
    requiredFields: ['businessName', 'contactPerson', 'phoneNumber', 'price']
  },
  {
    value: 'lost',
    label: 'Lost',
    color: 'red',
    requiredFields: ['businessName', 'contactPerson', 'phoneNumber', 'lossReason']
  }
];

const allowedColors = new Set(PIPELINE_COLORS.map(c => c.value));

export function normalizePipelineStages(stages) {
  const list = Array.isArray(stages) ? stages : [];
  const normalized = [];
  const seen = new Set();

  list.forEach(stage => {
    if (!stage || !stage.value || !stage.label) return;
    if (seen.has(stage.value)) return;

    const requiredFields = Array.isArray(stage.requiredFields)
      ? stage.requiredFields.filter(field => PIPELINE_FIELD_LABELS[field])
      : [];

    normalized.push({
      value: stage.value,
      label: stage.label,
      color: allowedColors.has(stage.color) ? stage.color : 'blue',
      requiredFields
    });
    seen.add(stage.value);
  });

  PIPELINE_RESERVED_VALUES.forEach(reserved => {
    if (seen.has(reserved)) return;
    const fallback = DEFAULT_PIPELINE_STAGES.find(stage => stage.value === reserved);
    if (fallback) {
      normalized.push({ ...fallback });
      seen.add(reserved);
    }
  });

  if (normalized.length === 0) {
    return DEFAULT_PIPELINE_STAGES.map(stage => ({ ...stage }));
  }

  return normalized;
}

export function getStageByValue(stages, value) {
  return (stages || []).find(stage => stage.value === value);
}

export function getStageLabel(stages, value) {
  return getStageByValue(stages, value)?.label || value || 'Unknown';
}

export function getStageColorClass(stages, value) {
  const color = getStageByValue(stages, value)?.color || 'gray';
  return PIPELINE_COLOR_CLASSES[color] || PIPELINE_COLOR_CLASSES.gray;
}

export function getRequiredFieldsForStage(stages, value) {
  return getStageByValue(stages, value)?.requiredFields || [];
}

export function slugifyStageValue(label) {
  return (label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'stage';
}
