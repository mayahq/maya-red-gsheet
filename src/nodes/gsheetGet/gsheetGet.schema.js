const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')
const makeRequestWithRefresh = require('../../util/reqWithRefresh')

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
            url: new fields.Typed({ type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global'] }),
            gridRange: new fields.Typed({ type: 'json', defaultVal: 'msg.payload', allowedTypes: ['msg', 'flow', 'global'] }),
            includeGridData: new fields.Typed({ type: 'bool', defaultVal: true, allowedTypes: ['msg', 'flow', 'global'] })
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

        let len = "https://docs.google.com/spreadsheets/d/".length;
        let spreadsheetId = vals.url.substring(len, vals.url.indexOf('/', len));

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