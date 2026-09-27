import type { Report } from './validator';
export const semanticVersion = '1.0.0';
const source = 'https://github.com/flexiblepower/s2-json/blob/d58b2f027c7b40374e8d57aee72d1876ed9e0763/';
export interface SemanticCheck { id: string; status: 'passed'|'failed'|'not-applicable'|'not-checked'; path: string; explanation: string; source: string }
export function semanticChecks(report: Report): SemanticCheck[] {
  const rules = [
    {id:'HS-001',type:'Handshake',path:'/supported_protocol_versions',explanation:'For role RM, supported_protocol_versions must be present.',source:source+'messages/Handshake.schema.json'},
    {id:'PEBC-001',type:'PEBC.PowerConstraints',path:'/allowed_limit_ranges',explanation:'Each range start must be less than or equal to its end.',source:source+'schemas/PEBC.AllowedLimitRange.schema.json'},
    {id:'PEBC-002',type:'PEBC.PowerConstraints',path:'/allowed_limit_ranges',explanation:'Include at least one UPPER_LIMIT and one LOWER_LIMIT.',source:source+'messages/PEBC.PowerConstraints.schema.json'}
  ];
  const data = report.schema === true && report.formatted ? JSON.parse(report.formatted) : null;
  return rules.map(({type,...rule}) => {
    if (report.selectedType && report.selectedType !== type) return {...rule,status:'not-applicable'};
    if (!data) return {...rule,status:'not-checked'};
    if (rule.id === 'HS-001') return {...rule,status:data.role !== 'RM' ? 'not-applicable' : Object.hasOwn(data,'supported_protocol_versions') ? 'passed':'failed'};
    const ranges = data.allowed_limit_ranges;
    // Upstream object schemas can admit null/scalars: never assume shape from schema success.
    if (!Array.isArray(ranges) || ranges.some(r => !r || typeof r !== 'object')) return {...rule,status:'not-checked'};
    if (rule.id === 'PEBC-002') {
      if (ranges.some(r => typeof r.limit_type !== 'string')) return {...rule,status:'not-checked'};
      return {...rule,status:ranges.some(r => r.limit_type === 'UPPER_LIMIT') && ranges.some(r => r.limit_type === 'LOWER_LIMIT') ? 'passed':'failed'};
    }
    if (ranges.some(r => !r.range_boundary || typeof r.range_boundary.start_of_range !== 'number' || typeof r.range_boundary.end_of_range !== 'number')) return {...rule,status:'not-checked'};
    const index = ranges.findIndex(r => r.range_boundary.start_of_range > r.range_boundary.end_of_range);
    return {...rule,path:index < 0 ? rule.path : `${rule.path}/${index}/range_boundary`,status:index < 0 ? 'passed':'failed'};
  });
}
