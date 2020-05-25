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

Для запуска тестов из корня проекта с приложением вызвать: 
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

    'Авторизация',
    '/login',

    {
        method: 'POST',

        params: {
            username: 'anyasinyavskaya1',
            password: '1999'
        },

        result: {
            status: 302
        }
    }
];    
```

В ```params``` указываются параметры запроса.
Результат может иметь два поля: ```status```, в котором указывается ожидаемый код состояния HTTP, и ```data```, в котором указывается ожидаемый JSON или другого типа объект возвращаемых данных. Например:


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
                            name: {
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

    }
```


Тип ожидаемого объекта указывается в поле ```type```. Возможные типы: *array, json, string*. Если у возвращаемого объекта типа JSON имеются свои поля, они указываются в поле ```properties```. 


