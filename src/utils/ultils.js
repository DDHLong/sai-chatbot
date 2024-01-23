export function checkNoNullFieldsOrEmptyStrings(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && (obj[key] === null || obj[key] === "")) {
      return false; // Found a null value or empty string
    }
  }
  return true; // No null values or empty strings found
}

export function findKeysWithNullValues(obj) {
  var keysWithNullValues = [];

  for (var key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === null) {
      keysWithNullValues.push(key);
    }
  }

  return keysWithNullValues.join(", ");
}
