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

/**
 * 
 * @param {import('./types').GsheetCell} cell 
 */
function getCellTypeDataFromGsheetCell(cell) {
    const val = cell.effectiveValue
    if (!val) {
        return {
            type: 'string',
            value: ''
        }
    }
    if (!isNullOrUndefined(val.boolValue)) {
        return {
            type: 'boolean',
            value: val.boolValue
        }
    } else if (!isNullOrUndefined(val.errorValue)) {
        return {
            type: 'error',
            value: val.errorValue.message
        }
    } else if (!isNullOrUndefined(val.formulaValue)) {
        return {
            type: 'string',
            value: val.formulaValue
        }
    } else if (!isNullOrUndefined(val.numberValue)) {
        return {
            type: 'number',
            value: val.numberValue
        }
    } else if (!isNullOrUndefined(val.stringValue)) {
        return {
            type: 'string',
            value: val.stringValue
        }
    } else {
        const vals = Object.values(val)
        try {
            if (vals.length === 0) {
                return {
                    type: 'string',
                    value: ''
                }
            }
            return {
                type: 'string',
                value: vals[0].toString()
            }
        } catch (e) {
            return {
                type: 'string',
                value: 'parse_error'
            }
        }
    }
}

/**
 * 
 * @param {import('./types').gsheetRow} row 
 */
function convertGsheetsRowToRowTypeData(idx, colNames, row) {
    const cells = row.values
    const res = {
        _identifier: {
            value: idx.toString(),
            type: 'rowIndex'
        },
        fields: {}
    }

    colNames.forEach((colName, idx) => {
        if (idx >= cells.length || !colName) {
            return
        }
        const colValue = cells[idx]
        res.fields[colName] = getCellTypeDataFromGsheetCell(colValue)
    })
    return res
}

function getDefautValueForType(type) {
    switch (type) {
        case 'boolean': return false
        case 'string': return ''
        case 'number': return 0
        case 'formula': return ''
        case 'error': return ''
    }
}

function getTableTypeDataFromSheet(sheet) {
    const gridData = sheet.data[0]
    if (!gridData) {
        return []
    }
    /**
     * @type {import('./types').GsheetRow[]}
     */
    const rowData = gridData.rowData
    if (!rowData || rowData.length <= 1) {
        return []
    } 
    const firstRow = rowData[0]
    const numColumns = firstRow.values.length
    const colNames = []
    for (let i = 0; i < numColumns; i++) {
        colNames.push(firstRow.values[i].formattedValue) || ''
    }

    const res = []
    for (let i = 1; i < rowData.length; i++) {
        res.push(convertGsheetsRowToRowTypeData(i, colNames, rowData[i]))
    }

    return res
}

function getColumnOrder(sheet) {
    console.log('sheetData', sheet)
    const gridData = sheet.data[0]
    if (!gridData) {
        return []
    }

    const rowData = gridData.rowData
    const firstRow = rowData[0]
    const colNames = []
    const numColumns = firstRow.values.length
    for (let i = 0; i < numColumns; i++) {
        colNames.push(firstRow.values[i].formattedValue) || ''
    }
    return colNames
}

function generateOrderedGsheetDataArray(order, rowData) {
    const gsheetRowData = []

    console.log('rowData', rowData)
    rowData.forEach(row => {
        const orderedFields = {}
        order.forEach(field => {
            if (row.fields[field]) {
                orderedFields[field] = row.fields[field]
            } else {
                orderedFields[field] = {
                    type: 'string',
                    value: ''
                }
            }
        })
    
        gsheetRowData.push(convertRowTypeDataToGsheetsRow({
            _identifier: {
                type: 'randomNumber',
                value: Math.floor(10000 * Math.random())
            },
            fields: orderedFields
        }))
    })

    return gsheetRowData
}

module.exports = {
    validateTableTypeData,
    validateRowUpdateTypeData,
    validateTableUpdateTypeData,
    convertRowTypeDataToGsheetsRow,
    convertGsheetsRowToRowTypeData,
    getTableTypeDataFromSheet,
    generateOrderedGsheetDataArray,
    getColumnOrder
}