# testy
Тестирование веб-приложений

### h3 Установка

Необходимо добавить в package.json тестируемого приложения
```
"scripts": {
    "preinstall": "npm install ../testy -g && npm install ../testy --save-dev"
  },
```
где ```../testy``` относительный путь к папке с проектом модуля для тестирования, после чего вызвать ```npm install```. 
