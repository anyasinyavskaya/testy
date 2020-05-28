# testy
Тестирование веб-приложений

### Установка

Необходимо добавить в `package.json` тестируемого приложения 
```
"scripts": {
    "preinstall": "npm install ../testy -g && npm install ../testy --save-dev"
  },
```
где `../testy` относительный путь к папке с проектом модуля для тестирования; после чего вызвать из командной строки ```npm install```. Таким образом произойдет локальная установка модуля тестирования в node_modules.

### Запуск

В корень проекта необходимо добавить директорию `/test` с .js файлами, содержащими тесты, и файл `config.js` с указанием сервера, на котором запускается приложение.

```
const server = {
    host: 'localhost',
    port: 3005,
};

module.exports = server;
```
> В проекте **chatmodel** (https://github.com/anyasinyavskaya/chatmodel) уже созданы все необходимые файлы и папки, описанные выше

Необходимо запустить проект с веб-приложением, а для запуска тестов параллельно из корня проекта с приложением вызвать: 
```
testy --config
```

Без указания ```--config``` будет принято значение по умолчанию:
```
    host: 'localhost',
    port: 3000,
```
### Примеры тестов

Пример post-запроса. Первой строкой опционально указывается название теста, затем url запроса. 
```
module.exports = [

    // название теста
    'Авторизация',
    // запрос, который будет дополнен до http://localhost:3005/login
    '/login',

    {
    
       // типа отсылаемого запросы
        method: 'POST',

       // параметры запроса
        params: {
            username: 'anyasinyavskaya1',
            password: '1999'
        },

        // ожидаемый результат
        result: {
            status: 302
        }
    }
];    
```

В ```params``` указываются параметры запроса.
Результат может иметь два поля: ```status```, в котором указывается ожидаемый код состояния HTTP, и ```data```, в котором описывается структура ожидаемого JSON или свойства другого типа объекта возвращаемых данных. Например:

```
module.exports = [

    'Отправка сообщения',
    '/room/send?name=ch3&text=test',
    {
        method: 'POST',

        result: {
            data: {
                type: 'json',
                properties: {
                    message: {
                        value: "Сообщение отправлено",
                        type: 'String'
                    },
                    result: {
                        type: 'object',
                        properties: {
                            _id: {
                                required: true
                            },
                            text: {
                                required: true,
                                type: 'String'
                            },
                            sendBy: {
                                required: true
                            }

                        }

                    }
                }
            }
        }

    },

    'Получение сообщений',
    '/room/getMessages',

    {
        method: 'POST',

        params: {
            name: 'ch3'
        },

        result: {
            data: {
                type: 'array'
            }
        }
    }
];
```

Тип ожидаемого объекта указывается в поле ```type```. Возможные типы: *array, json, string, number*. Если у возвращаемого объекта типа JSON имеются свои поля, они указываются в поле ```properties```. Если ожидается точное значение возвращаемого объекта или одного из его полей, оно указывается в поле ```value```. ```required: true``` проверяет наличие данного поля в результате, значение ```false``` не предусмотрено. В примере выше результат первого теста `Отправка сообщения` должен иметь следующую структуру:
```
{ message: 'Сообщение отправлено',
  result:
   { _id: 5ecc02be0dc4ce393e700127,
     text: 'test',
     sendBy: 5e91f78eda0dea2168927380 } }
```

Для результата типа ```array``` можно указать ожидаемый размер массива в поле ```size```:

```
    'get messages',
    '/room/getMessages',

    {
        method: 'POST',

        params: {
            name: 'ch3'
        },

        result: {
            data: {
                type: 'array',
                size: 30,
            }
        }
    },

```

Для типа ```number``` максимальное и минимальное возможное значение через поля ```maxValue```, ```minValue```.

Порядок выполнения тестов по умолчанию является порядком их следования в файле. Однако если нужно выполнить какой-либо запрос перед или после другого, url этого запроса или его название нужно указать в полях ```before``` или ```after```:

```
module.exports = [

    'Вход в чат',
    '/chat/enter?name=ch2',

    {
        method: 'GET',

        before: '/login?username=anyasinyavskaya&password=1999',

        result: {
            status: 200
        }
    },
];

```

```
module.exports = [

    'Вход в чат',
    '/chat/enter?name=ch2',

    {
        method: 'GET',

        after: 'logout',

        result: {
            status: 200
        }
    },

    'Выход из аккаунта',
    '/room/logout',
    {
        method: 'GET',

        result: {
            status: 200
        }
    },
];

```
### Результат

```
  chatmodel
    ✓ (test1) login (327ms)
    ✓ (test1) enter (203ms)
    1) (test1) get messages
    ✓ (test1) send message (188ms)


  3 passing (1s)
  1 failing

  1) chatmodel
       (test1) get messages:
     TestError: Полученный тип  : "string"
     Ожидаемый тип  : "array"
```
