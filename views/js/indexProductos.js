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

socket.on('productos-test', data => {
    console.log(data)
    renderTable(data)
})