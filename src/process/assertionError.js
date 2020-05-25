const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const STATUS_ERROR = 'status';
const STRUCTURE_ERROR = 'structure';
const MAX_ERROR = 'max';
const MIN_ERROR = 'min';

class AssertionError {

	constructor(expected, actual, type, param) {
		this.expected = expected;
		this.actual = actual;
		this.type = type;
		this.param = param;
		this.name = this.constructor.name;
		this.messages = "";

		switch (this.type) {
			case STATUS_ERROR: {
				this.messages+= 'Полученный код состояния: ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= '     Ожидаемый код состояния: ' + JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}
			case TYPE_ERROR: {
				this.messages+= 'Полученный тип ' + this.param + ' : ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= '     Ожидаемый тип ' + this.param + ' : ' + JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}
			case VALUE_ERROR: {
				this.messages+= 'Полученное значение ' + this.param + ' : ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= '     Ожидаемое значение ' + this.param + ' : ' + JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}
			case SIZE_ERROR: {
				this.messages+= 'Полученный размер ' + this.param + ' : ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= '     Ожидаемый размер ' + this.param + ' : ' + JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}
			case MAX_ERROR: {
				this.messages+= 'Полученное значение ' + this.param + ' : ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= 'Ожидаемое значение ' + this.param + ' не должно превышать:' +
					JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}
			case MIN_ERROR: {
				this.messages+= 'Полученное значение ' + this.param + ' : ' + JSON.stringify(this.actual, null, 4) + '\n';
				this.messages+= '     Ожидаемое значение ' + this.param + ' не должно быть меньше:' +
					JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}

			case STRUCTURE_ERROR: {
				this.messages+= 'Ожидалось наличие ' + this.param + ' : ' + JSON.stringify(this.expected, null, 4) + '\n';
				break;
			}

		}
	}

	getMessages() {
		return this.messages;
	}

}

module.exports = AssertionError;
