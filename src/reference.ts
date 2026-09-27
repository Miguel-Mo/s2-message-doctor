import { schemas } from './validator';
export interface Field {path:string;required:boolean|null;type:string;description:string;constraints:string;children:Field[]}
export function fieldsFor(messageType: string): Field[] {
  const root=schemas.find(s=>s.properties?.message_type?.const===messageType);
  if(!root)return [];
  function expand(schema:any, base:string):any {
    if(!schema.$ref)return schema;
    const id=new URL(schema.$ref,base).href;
    const target=schemas.find(s=>s.$id===id);
    return target ? {...target,...schema,$id:id} : schema;
  }
  function fields(schema:any,base:string,path:string,depth:number):Field[] {
    if(depth>6)return [];
    return Object.entries(schema.properties ?? {}).map(([name,raw])=>{
      const s=expand(raw,base), childBase=s.$id || base;
      const items=s.items ? expand(s.items,childBase):null;
      const constraints=['const','enum','format','pattern','minimum','maximum','minItems','maxItems','minLength','maxLength'].filter(k=>s[k]!==undefined).map(k=>`${k}: ${JSON.stringify(s[k])}`).join(' · ');
      const fieldPath=path+'/'+name.replace(/~/g,'~0').replace(/\//g,'~1');
      return {path:fieldPath,required:(schema.required??[]).includes(name),type:s.type ?? 'Type not explicitly constrained',description:s.description??'',constraints,children:items && !items.properties ? [{path:fieldPath+'/*',required:null,type:items.type ?? 'Type not explicitly constrained',description:items.description??'',constraints:['enum','const','format','pattern'].filter(k=>items[k]!==undefined).map(k=>`${k}: ${JSON.stringify(items[k])}`).join(' · '),children:[]}] : fields(items??s,items?.$id??childBase,fieldPath+(items?'/*':''),depth+1)};
    });
  }
  return fields(root,root.$id!,'',0);
}
