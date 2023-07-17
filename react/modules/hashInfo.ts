import { toHash } from './analytics/utils';

export async function hashPersonalInfo(
) {

    window.dataLayer?.map(async (data: any, idx: number) => {
        if (Object.keys(data)?.includes('visitorContactInfo'))
            window.dataLayer[idx].visitorContactInfo = await Promise.all( await data?.visitorContactInfo?.map((e: string) => toHash(e).then((value: string) => value)
            ))
        
        if (Object.keys(data)?.includes('visitorDemographicInfo')) 
            window.dataLayer[idx].visitorDemographicInfo = await Promise.all(await data?.visitorDemographicInfo?.map((e: string) => toHash(e).then((value: string) => value)))
        
  })
  
}
