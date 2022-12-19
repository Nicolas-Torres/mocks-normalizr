const norm = normalizr
const { normalize, denormalize, schema} = normalizr

//* CONECCION
const socket = io.connect()
console.log('WebSocket Connected')

//* ACTUALIZA LISTA DE PRODUCTOS
const renderTable = (data) => {
    const html = data.map(elem => `
        <tr key=${elem.id}>
            <td>${elem.id}</td>
            <td>${elem.title}</td>
            <td>${elem.price}</td>
            <td>
                <img src=${elem.thumbnail} alt="s" width="30" />
            </td>
        </tr>   
    `).join(' ')
    document.getElementById('lista-productos').innerHTML = html
}

socket.on('productos', data => {
    renderTable(data)
})

//* ENVIO DE NUEVO PRODUCTO
const registrar = (e) => {
    e.preventDefault()
    const title = nuevoProducto.title.value
    const price = nuevoProducto.price.value
    const thumbnail = nuevoProducto.thumbnail.value

    socket.emit('nuevo_producto', {title: title, price: price, thumbnail: thumbnail})

}

let nuevoProducto = document.querySelector('#registro_producto')
nuevoProducto.addEventListener("submit", registrar)

//* ACTUALIZA MENSAJES

const renderMensajes = async (msg) => {


    const { mensajes, percentNormalized } = await denormalizar(msg)
    const html = mensajes.map(val => `
       <li key=${val.id}>
            <div>
                <span id="msg-hora">[${val.hora}]: ></span>  
                <img src=${val.author.avatar} alt="s" width="30"/>
                <span id="msg-id">${val.author.id}</span>
                <span id="msg-nombre">${val.author.nombre}</span>
                <span id="msg-apellido">${val.author.apellido}</span>
                <span id="msg-edad">[${val.author.edad} años]: </span>
                <span id="msg-alias">(${val.author.alias})</span>
                <span id="msg-mensaje">${val.text}</span>
            </div>
       </li> 
    `).join(' ')
    document.getElementById('chat').innerHTML = html
    document.getElementById('normalized-rate').innerText = `(Compresión: ${percentNormalized}%)`
}




socket.on('mensajes', msg => {
    renderMensajes(msg)
})

//* ENVIO DE MENSAJES
const enviar = (e) => {
    e.preventDefault()

    const nombre = nuevoMensaje.nombre.value
    const apellido = nuevoMensaje.apellido.value
    const edad = nuevoMensaje.edad.value
    const alias = nuevoMensaje.alias.value
    const avatar = nuevoMensaje.avatar.value
    const correo = nuevoMensaje.correo.value
    const mensaje = nuevoMensaje.mensaje.value
    const hora = new Date().toLocaleString()

    const msg = {
        author: {
            nombre: nombre,
            apellido: apellido,
            edad: edad,
            alias: alias,
            avatar: avatar,
            id: correo
        },
        text: mensaje,
        hora: hora
    }

    nuevoMensaje.mensaje.value = ''

    socket.emit('nuevo_mensaje', msg)
}

let nuevoMensaje = document.querySelector('#formulario-chat')
nuevoMensaje.addEventListener("submit", enviar)





async function denormalizar(msg) {
    const authorsSchema = new schema.Entity('author')
    const msgSchema = new schema.Entity('msg', {
        author: authorsSchema
    })
    const mensajesSchema = new schema.Entity('mensajes', {
        mensajes: [msgSchema]
    })
    try {
        const denormalizedData = await denormalize(msg.result, mensajesSchema, msg.entities)
        const rateNormalized = JSON.stringify(denormalizedData).length/JSON.stringify(msg).length
        const percentNormalized = rateNormalized.toFixed(2) * 100
        const mensajes = denormalizedData.mensajes
        return { mensajes, percentNormalized }
    } catch (e){
        console.log(e)
    }
}

