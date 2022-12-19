const express = require('express')
const handlebars = require("express-handlebars")
const { Server: HTTPServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const Contenedor = require('./archivos')
const util = require('util')

const { faker }  = require('@faker-js/faker')
faker.locale = 'es'
const { commerce, image } = faker

const { normalize, schema}  = require('normalizr')
const print = (obj) => console.log(util.inspect(obj, false, 12, true))

//! SERVER
const app = express()
const PORT = process.env.PORT || 8081

const httpServer = new HTTPServer(app)
const io = new SocketServer(httpServer)

//! MIDDLEWARES
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//! HANDLEBARS FRONTEND
app.engine('hbs', handlebars.engine({
        extname: "hbs",
        layoutsDir: __dirname + "/views/layouts",
        partialsDir: __dirname + '/views/partials/',
        defaultLayout: "index"
}))
    
app.set('view engine', 'hbs')
app.set('views', './views')
    
app.use(express.static('views'))

const dbMensajes = new Contenedor('./db/mensajes.json')
const dbProductos = new Contenedor('./db/productos.json')

app.get('/', (req, res) => {
    res.render('main', {
        docTitle: "Desafio"
    })
})

let productos = []
app.get('/productos-test/', (req, res) => {
    for (let index = 0; index < 5; index++){
        productos.push({
            id: index+1,
            title: commerce.product(),
            price: commerce.price(1,1000,2,'S/'),
            thumbnail: image.avatar() 
        })
    }
    res.render('prods', {
        layout: 'productos.hbs',
        docTitle: "Desafio mocks"
    })
})

const normalizeMsg = (data) => {

    const mensajes = {
        id: "db-messages",
        mensajes: [...data]
    }
    const authorsSchema = new schema.Entity('author')
    const msgSchema = new schema.Entity('msg', {
        author: authorsSchema
    })
    const mensajesSchema = new schema.Entity('mensajes', {
        mensajes: [msgSchema]
    })

    const messagesNormalized = normalize(mensajes, mensajesSchema)
    return messagesNormalized
}



io.on('connection', async socket => {
    //! CONECTADO
    console.log(`conectado: ${socket.id}`)
    //! ENVIA PRODUCTOS Y MENSAJES DE LA DB

    try {
        let allMensajes = await dbMensajes.getAll()

        let mensajesNormalizados = normalizeMsg(allMensajes)
        // print(mensajesNormalizados.entities)
        let allProductos = await dbProductos.getAll()
        
        socket.emit('productos', allProductos)
        socket.emit('productos-test', productos)
        socket.emit('mensajes', mensajesNormalizados)
        productos = []
    } catch (err) {
        console.log(`Error get all messages from db: ${err.message}`)
    }

    //! RECIBE NUEVO PRODUCTO Y ENVIA A TODOS LOS SOCKETS
    socket.on('nuevo_producto', async data => {
        try {
            const { title, price, thumbnail } = data
            await dbProductos.save({ title, price, thumbnail })

            let allProductos = await dbProductos.getAll()
            io.sockets.emit('productos', allProductos)

        } catch (err) {
            console.log(err)
        }
    })

    //! RECIBE NUEVO MENSAJE Y ENVIA A TODOS LOS SOCKETS
    socket.on('nuevo_mensaje',  async msg => {
        console.log('nuevo mensaje', msg)
        try {

            //* NODEMON SE REINICIA PORQE SE MODIFICA UN ARCHIVO (mensajes.json)
            const { author, text, hora } = msg
            await dbMensajes.save({ author, text, hora})

            let allMensajes = await dbMensajes.getAll()
            let mensajesNormalizados = normalizeMsg(allMensajes)
            io.sockets.emit('mensajes', mensajesNormalizados)

        } catch (err) {
            console.log(`Error get all messages from db: ${err.message}`)
        }
    })
})

const server = httpServer.listen(PORT, () => {
    console.log(`Server express, Websockets y handlebars iniciado - PORT: ${PORT}`)
})


server.on('error', error => {
    console.log(error.message)
})


