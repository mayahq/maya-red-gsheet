const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const makeRequestWithRefresh = require('../../util/reqWithRefresh');
const { 
    validateRowUpdateTypeData, 
    convertRowTypeDataToGsheetsRow, 
    getTableTypeDataFromSheet ,
    generateOrderedGsheetDataArray,
    getColumnOrder
} = require('../../util/tableTypeData');

class GsheetAppend extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'gsheet-append',
        label: 'gsheet-append',
        category: 'Maya Red GSheet',
        color: '#4cde35',
        isConfig: false,
        icon: "drive.png",
        fields: {
            url: new fields.Typed({ type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global'] }),
            range: new fields.Typed({ type: 'str', defaultVal: 'Sheet1', allowedTypes: ['msg', 'flow', 'global'] }),
            values: new fields.Typed({ type: 'msg', defaultVal: 'payload', allowedTypes: ['msg', 'flow', 'global'] }),
            majorDimension: new fields.Select({ options: ['ROWS', 'COLUMNS'], defaultVal: 'ROWS', displayName: 'Major dimension' }),
            valueInputOption: new fields.Select({ options: ['RAW', 'USER_ENTERED'], defaultVal: 'USER_ENTERED', displayName: 'Value input type' }),
            insertDataOption: new fields.Select({ options: ['OVERWRITE', 'INSERT_ROWS'], defaultVal: 'INSERT_ROWS', displayName: 'Insert type' }),
            responseValueRenderOption: new fields.Select({ options: ['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA'], defaultVal: 'FORMATTED_VALUE' }),
            responseDateTimeRenderOption: new fields.Select({ options: ['FORMATTED_STRING', 'SERIAL_NUMBER'], defaultVal: 'FORMATTED_STRING' }),
        },

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Appending data");

        let len = "https://docs.google.com/spreadsheets/d/".length;
        let index2 = vals.url.indexOf('/', len);
        index2 = index2 <= 0 ? vals.url.length : index2;
        const spreadsheetId = vals.url.substring(len, index2);

        let gridRangeSheetId = 'Sheet1'
        if(vals.url) {
            let worksheetUrl = new URL(vals.url)
            gridRangeSheetId = worksheetUrl.hash.substring(5) || 'Sheet1'
        }

        const requestToGetFirstRow = {
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:getByDataFilter`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.tokens.vals.access_token}`,
            },
            data: {
                dataFilters: [{
                    gridRange: {
                        sheetId: gridRangeSheetId,
                        // startRowIndex: 1,
                        // endRowIndex: 2
                    }
                }],
                includeGridData: true
            }
        }

        const request = {
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURI(vals.range)}:append?insertDataOption=${vals.insertDataOption}&responseDateTimeRenderOption=${vals.responseDateTimeRenderOption}&responseValueRenderOption=${vals.responseValueRenderOption}&valueInputOption=${vals.valueInputOption}`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.tokens.vals.access_token}`,
            },
            data: {
                range: vals.range,
                majorDimension: vals.majorDimension,
            }
        }

        try {
            try {
                const res = await makeRequestWithRefresh(this, requestToGetFirstRow)
                console.log('yee', res.data)
    
                const columnOrder = getColumnOrder(res.data.sheets[0])
    
                console.log('values', vals.values)
                const orderedRowData = generateOrderedGsheetDataArray(columnOrder, vals.values)
                request.data.values = orderedRowData
            } catch (e) {
                const rows = vals.values
                if (!Array.isArray(rows)) {
                    rows = [rows]
                }
                const data = rows.map(row => convertRowTypeDataToGsheetsRow(row))
                request.data.values = data
            }
            
            const response = await makeRequestWithRefresh(this, request)
            msg.payload = response.data
            this.setStatus("SUCCESS", "Data added to spreadsheet");
            return msg;
        } catch (err) {
            console.log(err?.response?.data)
            msg.error = err;
            this.setStatus("ERROR", `Error occurred: ${err.message}`);
            return msg;
        }

    }
}

module.exports = GsheetAppend