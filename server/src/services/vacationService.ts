import {VacationRawData, ProcessedEvent} from "@/types/calendar";

/**
 * 시간 정보 포맷팅 (기존 서버 로직 기반)
 *
 * @param data 원본 휴가 데이터
 * @returns 화면 표시용 시간 정보 문자열
 */
const getTimeNameText = (data: VacationRawData): string => {
    // 종일 휴가 - 시간 형식으로 표시 (09:00~18:00)
    if (data.timeUnit === 'FULL') {
        return '09:00~18:00';
    }

    // 반차
    if (data.timeUnit === 'HALF') {
        return data.useTimeTypeName + ' ' + data.timeUnitName;
    }

    // 시간 단위 (QUARTER 또는 HOUR)
    if (data.timeUnit === 'QUARTER' || data.timeUnit === 'HOUR') {
        // halfAnHourSTime/halfAnHourETime 우선 사용 (HH:MM 형식)
        if (data.halfAnHourSTime && data.halfAnHourETime) {
            return data.halfAnHourSTime + '~' + data.halfAnHourETime;
        }
        // useStime/useEtime 사용 (HH 또는 HH:MM 형식)
        if (data.useStime && data.useEtime) {
            // HH 형식인 경우 HH:00으로 변환
            const startTime = data.useStime.includes(':') ? data.useStime : data.useStime + ':00';
            const endTime = data.useEtime.includes(':') ? data.useEtime : data.useEtime + ':00';
            return startTime + '~' + endTime;
        }
        // 시간 정보가 없으면 오전/오후 + 단위명
        return data.useTimeTypeName + ' ' + data.timeUnitName;
    }

    // 기타
    return data.useTimeTypeName + ' ' + data.timeUnitName;
};

/**
 * 시간 문자열을 분 단위로 변환 (예: "13:30" -> 810)
 */
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) {
        return 0;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        return 0;
    }
    return hours * 60 + minutes;
};

/**
 * 분 단위를 시간 문자열로 변환 (예: 810 -> "13:30")
 */
const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * 시간 범위 추출 (useStime~useEtime 또는 halfAnHourSTime~halfAnHourETime)
 */
const extractTimeRange = (data: VacationRawData): { start: number; end: number } | null => {
    let startTime: string | undefined;
    let endTime: string | undefined;

    // halfAnHourSTime/halfAnHourETime 우선 사용 (HH:MM 형식)
    if (data.halfAnHourSTime && data.halfAnHourETime) {
        startTime = data.halfAnHourSTime;
        endTime = data.halfAnHourETime;
    }
    // useStime/useEtime 사용 (HH 또는 HH:MM 형식)
    else if (data.useStime && data.useEtime) {
        // HH 형식인 경우 HH:00으로 변환
        startTime = data.useStime.includes(':') ? data.useStime : data.useStime + ':00';
        endTime = data.useEtime.includes(':') ? data.useEtime : data.useEtime + ':00';
    }

    if (startTime && endTime) {
        return {
            start: timeToMinutes(startTime),
            end: timeToMinutes(endTime)
        };
    }

    return null;
};

/**
 * 같은 날짜, 같은 사람의 시간 휴가를 병합
 */
const mergeVacationsByUser = (data: VacationRawData[]): VacationRawData[] => {
    // usId (사용자 ID) + useSdate (날짜)로 그룹화
    const grouped = new Map<string, VacationRawData[]>();

    for (const item of data) {
        const key = `${item.usId}_${item.useSdate}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(item);
    }

    const merged: VacationRawData[] = [];

    for (const [key, items] of grouped.entries()) {
        // 시간 휴가만 필터링 (QUARTER 또는 HOUR)
        const timeVacations = items.filter(item =>
            item.timeUnit === 'QUARTER' || item.timeUnit === 'HOUR'
        );

        // 시간 휴가가 아니거나 1개뿐이면 그냥 추가
        if (timeVacations.length <= 1) {
            merged.push(...items);
            continue;
        }

        // 시간 범위 추출 및 정렬
        const timeRanges = timeVacations
            .map(item => ({
                item,
                range: extractTimeRange(item)
            }))
            .filter(({ range }) => range !== null)
            .sort((a, b) => a.range!.start - b.range!.start);

        if (timeRanges.length === 0) {
            merged.push(...items);
            continue;
        }

        // 연속된 시간 병합
        const mergedRanges: Array<{ start: number; end: number; items: VacationRawData[] }> = [];
        let currentRange = {
            start: timeRanges[0].range!.start,
            end: timeRanges[0].range!.end,
            items: [timeRanges[0].item]
        };

        for (let i = 1; i < timeRanges.length; i++) {
            const { range, item } = timeRanges[i];

            // 현재 범위의 끝 시간과 다음 시작 시간이 같거나 겹치면 병합
            if (range!.start <= currentRange.end) {
                currentRange.end = Math.max(currentRange.end, range!.end);
                currentRange.items.push(item);
            } else {
                mergedRanges.push(currentRange);
                currentRange = {
                    start: range!.start,
                    end: range!.end,
                    items: [item]
                };
            }
        }
        mergedRanges.push(currentRange);

        // 병합된 휴가 데이터 생성
        for (const range of mergedRanges) {
            const firstItem = range.items[0];
            const mergedItem: VacationRawData = {
                ...firstItem,
                useStime: minutesToTime(range.start),
                useEtime: minutesToTime(range.end),
                halfAnHourSTime: minutesToTime(range.start),
                halfAnHourETime: minutesToTime(range.end)
            };
            merged.push(mergedItem);
        }

        // 시간 휴가가 아닌 나머지 추가
        const nonTimeVacations = items.filter(item =>
            item.timeUnit !== 'QUARTER' && item.timeUnit !== 'HOUR'
        );
        merged.push(...nonTimeVacations);
    }

    return merged;
};

/**
 * 달력 입력 데이터 계산 (기존 서버 로직 기반)
 *
 * @param data 원본 휴가 데이터 배열
 * @param lastIndex 처리할 데이터 개수
 * @returns 가공된 이벤트 데이터
 */
const renderUseCalcData = (data: VacationRawData[], lastIndex: number): ProcessedEvent[] => {
    const events: ProcessedEvent[] = [];

    for (let i = 0; i < lastIndex; i++) {
        const useDayCnt = getTimeNameText(data[i]);

        events.push({
            id: data[i].useId,
            start: data[i].useSdate,
            end: data[i].useEdate + " 24:00:00",
            title: data[i].usName + "(" + useDayCnt + ")",
            name: data[i].usName,
            allDay: true,
        });
    }

    return events;
};

/**
 * 휴가 데이터 가공 (캘린더 표시용)
 *
 * @param raw 원본 휴가 데이터 배열
 * @returns 가공된 이벤트 데이터
 */
export const processCalendarData = (raw: VacationRawData[]): ProcessedEvent[] => {
    // 같은 날짜, 같은 사람의 시간 휴가 병합
    const mergedData = mergeVacationsByUser(raw);
    return renderUseCalcData(mergedData, mergedData.length);
};
