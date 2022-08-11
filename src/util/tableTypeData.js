const isNullOrUndefined = (val) => val === undefined || val === null

/**
 * 
 * @param {any} data 
 * @returns {boolean}
 */
function validateTableTypeData(data) {
    if (typeof data !== 'object') {
        return false
    }

    const values = Object.values(data)
    for (let i = 0; i < values.length; i++) {
        const val = values[i]
        if (isNullOrUndefined(val.type) || isNullOrUndefined(val.value)) {
            return false
        }
    }

    return true
}

function validateRowUpdateTypeData(data) {
    if (typeof data !== 'object' || Array.isArray(data)) {
        return false
    }

    const _identifier = data._identifier
    if (isNullOrUndefined(_identifier) || isNullOrUndefined(_identifier.value)) {
        return false
    }

    const fields = data.fields
    const fieldsAreValid = validateTableTypeData(fields)

    if (!fieldsAreValid) {
        return false
    }

    return true
}

function validateTableUpdateTypeData(data) {
    if (!Array.isArray(data)) {
        return false
    }

    return data.every(row => validateRowUpdateTypeData(row))
}

/**
 * 
 * @param {import('./types').RowUpdateType} rowTypeData 
 * @returns {any[]}
 */
function convertRowTypeDataToGsheetsRow(rowTypeData) {
    const vals = []
    Object.values(rowTypeData.fields).forEach(val => {
        vals.push(val.value)
    })
    return vals
}

module.exports = {
    validateTableTypeData,
    validateRowUpdateTypeData,
    validateTableUpdateTypeData,
    convertRowTypeDataToGsheetsRow,
}