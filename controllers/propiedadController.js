import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'


const admin = async (req, res) => {

  // Leer QueryString
  const { pagina: paginaActual } = req.query

  const regex = /^[0-9]$/
  if(!regex.test(paginaActual)) {
    return res.redirect('/mis-propiedades?pagina=1')
  }

  try {
    const { id } = req.usuario

    // Limites y Offset para el paginador
    const limit = 5
    const offset = (paginaActual * limit) - limit

    const [propiedades, total] = await Promise.all([
      Propiedad.findAll({
        limit,
        offset,
        where: {
          usuarioId: id,
        },
        include: [
          {model: Categoria, as: 'categoria'},
          {model: Precio, as: 'precio'},
          {model: Mensaje, as: 'mensajes'}
        ]
      }),
      Propiedad.count({
        where: { usuarioId: id}
      })
    ])
  
    res.render("propiedades/admin", {
      pagina: "Mis propiedades",
      propiedades,
      csrfToken: req.csrfToken(),
      paginas: Math.ceil(total / limit),
      paginaActual: Number(paginaActual),
      total,
      offset,
      limit
    })
  } catch (error) {
    console.log(error)
  }
 
}

const crear = async (req, res) => {
    // Consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',        
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
  // Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    // Consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propiedades/crear", {
      pagina: "Crear Propiedad",      
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      datos: req.body,
      errores: resultado.array()
    });
  }

  // Crear un registro
  const {
    titulo, descripcion, habitaciones, estacionamiento,
    wc, calle, lat, lng, categoria: categoriaId, precio: precioId, 
  } = req.body;

  const {id: usuarioId} = req.usuario

  try {
    const propiedadGuardada = await Propiedad.create({
        titulo,
        descripcion,
        habitaciones,
        estacionamiento,
        wc,
        calle,
        lat,
        lng,
        categoriaId,
        precioId,
        usuarioId,
        imagen: ''
    })

    const { id } = propiedadGuardada
    res.redirect(`/propiedades/agregar-imagen/${id}`)
  } catch (error) {
    console.log(error)
  }

};

const agregarImagen = async (req, res) => {
  // Validar que la propiedad exista
  const { id } = req.params
  const propiedad = await Propiedad.findByPk(id)
  if (!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad pertenece a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect('/mis-propiedades')
  }
  

  res.render('propiedades/agregar-imagen', {
    pagina: `Agregar Imagen: ${propiedad.titulo}`, 
    propiedad,
    csrfToken: req.csrfToken()
  })
}

const almacenarImagen = async (req, res, next) => {
  // Validar que la propiedad exista
  const { id } = req.params
  const propiedad = await Propiedad.findByPk(id)
  if (!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  // Validar que la propiedad pertenece a quien visita esta pagina
  if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
    return res.redirect('/mis-propiedades')
  }

  try {
    // Almacenar la imagen y publicar propiedad
    propiedad.imagen = req.file.filename
    propiedad.publicado = true

    await propiedad.save()

    next()

  } catch (error) {
    console.log(error)
  }

}

const editar = async (req, res) => {

  const { id } = req.params

  // Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Revisar que quien visita la URL, es del usuario
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')
  }

  // Consultar modelo de precio y categorias
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ])

  res.render("propiedades/editar", {
    pagina: `Editar Propiedad ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad,
  })
}

const guardarCambios = async (req, res) => {

  // Verificar la validacion
  // Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    // Consultar modelo de precio y categorias
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);

    return res.render("propiedades/editar", {
      pagina: "Editar Propiedad",
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body
    })
  }

  const { id } = req.params

  // Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Revisar que quien visita la URL, es del usuario
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')
  }

  // Reescribir el objeto y actualizarlo
  try {
    const {
      titulo, descripcion, habitaciones, estacionamiento,
      wc, calle, lat, lng, categoria: categoriaId, precio: precioId, 
    } = req.body;
  
    propiedad.set({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat, 
      lng, 
      categoriaId, 
      precioId
    })  

    await propiedad.save()

    res.redirect('/mis-propiedades')
  
  } catch (error) {
    console.log(error)
  }

}

const eliminar = async (req, res) => {
  const { id } = req.params

  // Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Revisar que quien visita la URL, es del usuario
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')
  }

  // Eliminar la imagen asociada
  await unlink(`public/uploads/${propiedad.imagen}`)

  // Eliminar la propiedad
  await propiedad.destroy()
  res.redirect('/mis-propiedades')
}

const cambiarEstado = async (req, res) => {
  const { id } = req.params

  // Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id)
  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Revisar que quien visita la URL, es del usuario
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')
  }

  propiedad.publicado = !propiedad.publicado
  await propiedad.save()

  res.json({
    resultado: true
  })
}

// Muestra una propiedad, es publico
const mostrarPropiedad = async (req, res) => {
  const { id } = req.params

  // Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Categoria, as: 'categoria'},
      {model: Precio, as: 'precio'}
    ]
  })
 
  if(!propiedad || !propiedad.publicado) {
    return res.redirect('/404')
  }

  res.render('propiedades/mostrar', {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)    
  })
}

const enviarMensaje = async (req, res) => {
  const { id } = req.params

  // Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Categoria, as: 'categoria'},
      {model: Precio, as: 'precio'}
    ]
  })
 
  if(!propiedad) {
    return res.redirect('/404')
  }

  // Renderizar los errores
  // Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
      return res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        errores: resultado.array()
      })
  }

  const { mensaje } = req.body
  const { id: propiedadId } = req.params
  const { id: usuarioId } = req.usuario

  // Almacenar el mensaje
  await Mensaje.create({
    mensaje,
    propiedadId,
    usuarioId
  })

  res.render('propiedades/mostrar', {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
    enviado: true    
  })
}

// Leer mensajes recibidos
const verMensajes = async (req, res) => {
  const { id } = req.params

  // Validar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Mensaje, as: 'mensajes', 
        include: [
          {model: Usuario.scope('discriminarDatos'), as: 'usuario'}
        ]
      }
    ]
  })
  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  // Revisar que quien visita la URL, es del usuario
  if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')
  }

  console.log("******************" + JSON.stringify(propiedad))

  res.render('propiedades/mensajes', {
    pagina: 'Mensajes',
    mensajes: propiedad.mensajes, 
    formatearFecha
  })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje, 
    verMensajes
}