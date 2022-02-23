const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

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
        category: 'Maya Red Gsheet',
        isConfig: false,
        fields: {
            url: new fields.Typed({type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global']}),
            gridRange: new fields.Typed({type: 'jsonata', defaultVal: 'Sheet1', allowedTypes: ['msg', 'flow', 'global']}),
            includeGridData: new fields.Typed({type: 'bool', defaultVal: true, allowedTypes: ['msg', 'flow', 'global']})
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
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

        this.setStatus("PROGRESS", "fetching data from spreadsheet...");
        var fetch = require("node-fetch"); // or fetch() is native in browsers
        let len = "https://docs.google.com/spreadsheets/d/".length;
        let spreadsheetId = vals.url.substring(len,vals.url.indexOf('/',len));
        let fetchConfig = {
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:getByDataFilter`,
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.tokens.vals.access_token}`,
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                dataFilters: [{
                    gridRange: vals.gridRange
                }],
                includeGridData: true
            })
        }
        try{
            let res = await fetch(fetchConfig.url, 
            {
                method: fetchConfig.method,
                headers: fetchConfig.headers,
                body: fetchConfig.body
            });
            let json = await res.json();
            if(json.error){
                if(json.error.code === 401){
                    const { access_token } = await this.refreshTokens()
                    if (!access_token) {
                        this.setStatus('ERROR', 'Failed to refresh access token')
                        msg["__isError"] = true;
                        msg.error = {
                            reason: 'TOKEN_REFRESH_FAILED',
                        }
                        return msg
                    }
                    fetchConfig.headers.Authorization = `Bearer ${access_token}`;
                    res = await fetch(fetchConfig.url, 
                            {
                                method: fetchConfig.method,
                                headers: fetchConfig.headers,
                                body: fetchConfig.body
                            });
                    json = await res.json();
                    if(json.error){
                        msg["__isError"] = true;
                        msg.error = json.error;
                        this.setStatus("ERROR", json.error.message);
                        return msg;
                    }
                } else {
                    msg.error = json.error;
                    msg["__isError"] = true;
                    this.setStatus("ERROR", json.error.message);
                    return msg;
                }
                
            }
            msg.payload = json;
            this.setStatus("SUCCESS", "fetched");
            return msg;
        }
        catch(err){
            msg.error = err;
            this.setStatus("ERROR", "error occurred");
            return msg;
        }

    }
}

module.exports = GsheetGet