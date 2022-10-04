const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const makeRequestWithRefresh = require('../../util/reqWithRefresh')
const { getTableTypeDataFromSheet } = require('../../util/tableTypeData')
const GsheetUrl = require('../gsheetUrl/gsheetUrl.schema.js')
class GsheetGet extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'gsheet-get',
        label: 'gsheet-get',
        category: 'Maya Red GSheet',
        color: '#4cde35',
        isConfig: false,
        icon: "drive.png",
        fields: {
            GsheetUrl: new fields.ConfigNode({ type: GsheetUrl }),
            gridRange: new fields.Typed({ type: 'json', defaultVal: '{}', allowedTypes: ['msg', 'flow', 'global'], displayName: 'Grid range' }),
            includeGridData: new fields.Typed({ type: 'bool', defaultVal: true, allowedTypes: ['msg', 'flow', 'global'], displayName: 'Include grid data' })
        },

    })

    async refreshTokens() {
        const newTokens = await refresh(this)
        await this.tokens.set(newTokens)
        return newTokens
    }

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        this.setStatus("PROGRESS", "Fetching data from spreadsheet");
        vals.url = vals.GsheetUrl.url;
        let len = "https://docs.google.com/spreadsheets/d/".length;
        let spreadsheetId = vals.url.substring(len, vals.url.indexOf('/', len));
        let worksheetUrl;
        if(vals.url) {
            worksheetUrl = new URL(vals.url)
            if(!Object.keys(vals.gridRange).includes('sheetId')) {
                vals.gridRange['sheetId'] = worksheetUrl.hash.substring(5);
            }
        }
        const request = {
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:getByDataFilter`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.tokens.vals.access_token}`,
            },
            data: {
                dataFilters: [{
                    gridRange: vals.gridRange
                }],
                includeGridData: true
            }
        }

        try {
            const response = await makeRequestWithRefresh(this, request)
            try {
                const gsheetData = response.data.sheets[0]
                const tableData = getTableTypeDataFromSheet(gsheetData)
                msg.table = tableData
                msg.rowData = tableData
            } catch (e) {
                console.log('There was an error formatting gsheet data', e)
            }
            msg.payload = response.data
            this.setStatus("SUCCESS", "Fetched");
            return msg;
        }
        catch (err) {
            msg.error = err;
            this.setStatus("ERROR", `Error occurred: ${err.message}`);
            return msg;
        }

    }
}

module.exports = GsheetGet