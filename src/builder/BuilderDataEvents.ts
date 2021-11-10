
export class BuilderDataEvent
{
    type: string;
    data: any;
    constructor(type: string, data?: any)
    {
        this.type = type;
        this.data = data;
    }
}

export var builderDataEvents: Array<BuilderDataEvent> = [];
