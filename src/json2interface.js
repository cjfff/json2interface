/**
 * Parse a JSON string and returns a TypeScript interface representation
 * @param {string} jsonData a valid JSON string
 * @param {string} rootInterfaceName the name of the top level interface. Defaults to 'RootObject'
 */
export function generate (jsonData, rootInterfaceName = 'RootObject') {
  let jsonObject = JSON.parse(jsonData)

  if (_isArray(jsonObject) && jsonObject.length) {
    jsonObject = jsonObject[0]
  }

  const result = []

  _findAllInterfaces(jsonObject, rootInterfaceName, result)

  return result.join('\n\n')
}

/**
 * Extract all jsonNodes to be remapped to a TypeScript interface
 * @param {object} jsonNode the jsonNode
 * @param {object} interfaces the interfaces array
 */
function _findAllInterfaces (jsonNode, interfaceName, result) {
  result.push(_mapJsonNodeToTypescriptInterface(jsonNode, interfaceName))

  Object.keys(jsonNode).forEach(key => {
    if (!_isPrimitiveType(jsonNode[key])) {
      const isArray = _isArray(jsonNode[key])

      if (isArray) {
        jsonNode[key] = jsonNode[key][0]
      }

      // The array does not contains only primitive types and the value is not null or undefined
      if (
        !_isPrimitiveType(jsonNode[key]) &&
        !_isNullOrUndefined(jsonNode[key])
      ) {
        _findAllInterfaces(jsonNode[key], _toPascalCase(key), result)
      }
    }
  })

  return jsonNode
}

/**
 * Generates the TypeScript interface for a single level json object
 * @param {object} jsonNode a json object
 * @param {string} interfaceName the name of the interface mapping this node
 */
function _mapJsonNodeToTypescriptInterface (jsonNode, interfaceName) {
  const outputInterface = `export interface ${interfaceName} {\n`
    .concat(
      Object.keys(jsonNode)
        .map(key =>
          !_isNullOrUndefined(jsonNode[key])
            ? `  ${_toCamelCase(key)}: ${_getType(key, jsonNode[key])};\n`
            : `  ${_toCamelCase(key)}?: any\n`
        )
        .join('')
    )
    .concat('}')

  return outputInterface
}

/**
 * Returns the TypeScript type of the value
 * e.g. string, number, string[] or CustomType[]
 * @param {string} propertyName the name of the property
 * @param {any} propertyValue the property value
 */
function _getType (propertyName, propertyValue) {
  if (_isPrimitiveType(propertyValue)) {
    return typeof propertyValue
  } else if (_isArray(propertyValue)) {
    return `${
      _isPrimitiveType(propertyValue[0])
        ? typeof propertyValue[0]
        : _toPascalCase(propertyName)
    }[]`
  } else {
    return _toPascalCase(propertyName)
  }
}

/**
 * Capitalizes a string. If the string is kebab-cased it will be converted to PascalCase.
 * e.g. geographic-position -> GeographicPosition, user -> User
 * @param {string} text the name of the property
 */
function _toPascalCase (text) {
  text = text.split('-')
  return text.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('')
}

/**
 * If the string is kebab-cased it will be converted to camelCase.
 * e.g. geographic-position -> geographicPosition, user -> user
 * @param {string} text the name of the property
 */
function _toCamelCase (text) {
  text = text.split('-')
  return text
    .map((value, index) =>
      index === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1)
    )
    .join('')
}

/**
 * Checks if the type of the param is a JavaScript primitive type or not
 * @param {any} value the value to be checked
 */
function _isPrimitiveType (value) {
  return typeof value !== 'object'
}

/**
 * Checks if the type of the param is a JavaScript Array
 * @param {any} value the value to be checked
 */
function _isArray (value) {
  return typeof value === 'object' && Array.isArray(value)
}

/**
 * Checks if the type of the param is null or undefined
 * @param {any} value the value to be checked
 */
function _isNullOrUndefined (value) {
  return value === null || typeof value === 'undefined'
}

export default generate
