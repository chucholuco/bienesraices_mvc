import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Jesus',
        email: 'chucholuco@gmail.com',
        confirmado: 1,
        password: bcrypt.hashSync('a12345', 10)
    }
]

export default usuarios