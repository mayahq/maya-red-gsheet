const {
    Node,
    Schema,
    fields
} = require('@mayahq/module-sdk')

class GsheetUrl extends Node {
    constructor(node, RED, opts) {
        super(node, RED, {
            ...opts,
            // masterKey: 'You can set this property to make the node fall back to this key if Maya does not provide one'
        })
    }

    static schema = new Schema({
        name: 'gsheet-url',
        label: 'gsheet-url',
        category: 'config',
        isConfig: true,
        fields: {
            // Whatever custom fields the node needs.
            url: new fields.Typed({ required: true, type: 'str', defaultVal: '', allowedTypes: ['msg', 'flow', 'global'] }),

        },
        redOpts: {
            credentials: {
                
            }
        }

    })

    onInit() {
        // Do something on initialization of node
    }

    async onMessage(msg, vals) {
        // Handle the message. The returned value will
        // be sent as the message to any further nodes.

    }
}

module.exports = GsheetUrl