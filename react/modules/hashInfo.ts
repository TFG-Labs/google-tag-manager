import { PixelMessage } from '../typings/events';
import { toHash } from './analytics/utils';

export async function hashPersonalInfo(
  e: PixelMessage
) {

    window.dataLayer.map((data: any, idx: number) => {
        if (Object.keys(data).includes('visitorContactInfo'))
            window.dataLayer[idx].visitorContactInfo = data?.visitorContactInfo.map((e: string) => toHash(e)
            )
        
        if (Object.keys(data).includes('visitorDemographicInfo')) 
            window.dataLayer[idx].visitorDemographicInfo = data?.visitorDemographicInfo.map((e: string) => toHash(e))
        
  })
  
}
