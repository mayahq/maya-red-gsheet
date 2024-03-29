const axios = require('axios')
const refresh = require('./refresh')

async function makeRequestWithRefresh(node, request, { force = false } = {}) {
    try {
        // // Testing token refresh
        // const e = new Error('Simulating request failure')
        // e.response = { status: 401 }
        // throw e

        console.log('making request', request)
        const response = await axios(request)
        return response
    } catch (e) {
        console.log('Error making request, might have to refresh tokens')
        console.log(e?.response?.status, e?.response?.data)
        if (e.response && parseInt(e.response.status) === 401) {
            const start = Date.now()
            const { tokens, fromCache } = await refresh(node, { force })
            const { access_token } = tokens
            const end = Date.now()

            console.log(`Token refresh took ${end-start}ms`)
            if (!access_token) {
                const err = new Error('Unable to refresh tokens')
                err.name = 'TOKEN_REFRESH_FAILED'
                throw err
            }

            request.headers.Authorization = `Bearer ${access_token}`
            try {
                const response = await axios(request)
                return response
            } catch (e) {
                // If the request fails even after refresh but the new token was fetched from cache,
                // force a refresh of the cloud token and attempt the request with that.
                if (!fromCache) throw e
                if (e.response && parseInt(e.response.status) === 401) {
                    const { tokens } = await refresh(node, { force: true })
                    const { access_token } = tokens
                    request.headers.Authorization = `Bearer ${access_token}`
                    const response = await axios(request)
                    return response
                } else {
                    throw e
                }
            }
        } else {
            throw e
        }
    }
}

module.exports = makeRequestWithRefresh