/**
 * An individual cell value in a table row
 */
 export type TableValue = {
    type: string; // can be a non-primitive language type
    value: string;
}

/**
 * An individual row in the table (it's a map)
 */
export type RowTypeData = {
    [key: string] : TableValue;
}

/**
 * Standard to specify row updates
 */
export type RowUpdateType = {
    _identifier: {
        value: string;
        type?: string // Additional data to tell module what kind of identifier is being used. For eg. email, id, etc
    },
    fields: RowTypeData
}

export type GsheetCell = {
    effectiveValue: {
        stringValue?: string;
        boolValue?: boolean;
        numberValue?: number;
        formulaValue?: string;
        errorValue?: {
            type: string;
            message: string;
        }
    }
    formattedValue: string;
}

export type GsheetRow = {
    values: GsheetCell[];
}

/**
 * Standard to specify multiple row updates at once
 */
export type TableUpdateType = RowUpdateType[] 