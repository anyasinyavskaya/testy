const STRUCTURE_ERROR = 'structure';
const ARGUMENTS_ERROR = 'arguments';
const DECLARE_ERROR = 'declaration';
const TYPEMISMATCH_ERROR = 'mismatch';


class GrammarError {
    constructor(expected, type) {
        this.expected = expected;
        this.type = type;
        this.messages = "";

        switch (this.type) {
            case STRUCTURE_ERROR: {
                this.messages += 'В тесте должно быть поле ' + this.expected + '\n';
                break;
            }
            case DECLARE_ERROR: {
                this.messages += 'В тесте должен быть объявлен запрос или функция\n';
                break;
            }
            case ARGUMENTS_ERROR: {
                this.messages += 'Параметры не соответствуют аргументам функции\n';
                break;
            }
            case TYPEMISMATCH_ERROR:{
                this.messages += 'Поле ' + this.expected + '\n';
                break;
            }
        }
    }

    getMessages() {
        return this.messages;
    }

}

module.exports = GrammarError;