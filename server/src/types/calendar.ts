export interface VacationData {
    message : string;
    response : VacationRawData[];
    status : string;
}

export interface VacationRawData {
    useId: string;
    usName: string;
    useSdate: string;
    useEdate: string;
    timeUnit: 'FULL' | 'HALF' | 'QUARTER' | 'HOUR';
    timeUnitName: string;
    useTimeTypeName: string;
    useDayCnt: string;
    useStime?: string;
    useEtime?: string;
    halfAnHourTimeYn?: 'Y' | 'N';
    halfAnHourSTime?: string;
    halfAnHourETime?: string;
    itemId?: string;
    color?: string;
    aprvDocStsName: string;
    usId:string;
}

export interface ProcessedEvent {
    id: string;
    start: string;
    end: string;
    title: string;
    allDay: boolean;
    name : string;
}