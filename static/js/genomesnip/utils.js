var storage = (function() {
    var uid = new Date,
        storage,
        result;
    try {
      (storage = window.localStorage).setItem(uid, uid);
      result = storage.getItem(uid) == uid;
      storage.removeItem(uid);
      return result && storage;
    } catch(e) {}
}());



/*
 * Input data in the format of {attributes : .... , "value": someValue, "normalizedValue": normalizedValue} for normalization
 * Provided the desired range of normalized Data
 */

function normalizeData(data, maximum, minimum, desMax, desMin) {
	for(i in data){
		var normalizedValue = desMin + (data[i].value - minimum)*(desMax - desMin)/(maximum - minimum);
		if(normalizedValue > 50)
			console.log(data[i].value);
		data[i].normalizedValue = normalizedValue;
	}
	return data;
}

function origData(data, maximum, minimum, desMax, desMin) {
	for(i in data){
		data[i].normalizedValue = data[i].value*50;
	}
	return data;
}