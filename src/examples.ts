import { t } from './i18n';
const message_id = '550e8400-e29b-41d4-a716-446655440000';
export const examples = {
  Handshake: { message_type: 'Handshake', message_id, role: 'RM', supported_protocol_versions: ['1.0.0'] },
  ResourceManagerDetails: { message_type: 'ResourceManagerDetails', message_id, resource_id: 'resource-01', name: 'Example solar inverter', roles: [{role: 'ENERGY_PRODUCER', commodity: 'ELECTRICITY'}], instruction_processing_delay: 100, available_control_types: ['POWER_ENVELOPE_BASED_CONTROL'], provides_forecast: false, provides_power_measurement_types: ['ELECTRIC.POWER.L1'] },
  'PEBC.PowerConstraints': { message_type: 'PEBC.PowerConstraints', message_id, id: 'constraints-01', valid_from: '2026-01-01T00:00:00Z', consequence_type: 'VANISH', allowed_limit_ranges: ['UPPER_LIMIT', 'LOWER_LIMIT'].map(limit_type => ({commodity_quantity: 'ELECTRIC.POWER.L1', limit_type, range_boundary: {start_of_range: -5000, end_of_range: 0}, abnormal_condition_only: false})) }
};
const { message_id: omitted, ...missingId } = examples.Handshake;
export const learningExamples = {
  'missing-field': { label: t.missingExample, message: missingId, lesson: t.missingLesson },
  'numeric-text': { label: t.numericExample, message: {...examples.ResourceManagerDetails, instruction_processing_delay: '100'}, lesson: t.numericLesson },
  'unknown-enum': { label: t.enumExample, message: {...examples.Handshake, role: 'DEVICE'}, lesson: t.enumLesson },
  'invalid-date': { label: t.dateExample, message: {...examples['PEBC.PowerConstraints'], valid_from: 'tomorrow'}, lesson: t.dateLesson }
};
