import { connectDB, closeDB } from '../config/database';
import { initModels, User } from '../models';

async function createAdmin() {
  try {
    console.log('Conectando ao banco de dados...');
    await connectDB();
    await initModels();

    // Ler credenciais de variáveis de ambiente ou usar padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123456';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    const adminData = {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin' as const,
      isActive: true,
      isVerified: true,
    };

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email: adminData.email } });

    if (existingUser) {
      console.log('✅ Usuário administrador já existe!');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Ativo:', existingUser.isActive);
      await closeDB();
      return;
    }

    // Criar usuário admin
    const admin = await User.create(adminData);

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminEmail);
    console.log('Nome:', adminName);
    console.log('Role:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('⚠️  Altere a senha após o primeiro login!');
    console.log('\n📝 Para usar credenciais personalizadas:');
    console.log('   ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=SenhaForte@123 ADMIN_NAME="Seu Nome" npx ts-node src/scripts/create-admin.ts\n');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    await closeDB();
    process.exit(1);
  }
}

createAdmin();
