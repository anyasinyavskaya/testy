class TestError extends Error {
	constructor(name, message) {
		super(message);
		this.name = name === ""? this.constructor.name : name;
	}
}
module.exports = TestError;
