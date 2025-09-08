import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed...');

  // Limpa dados existentes para evitar duplicatas
  await prisma.carImage.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();

  // --- Criar Usuários ---
  const senhaAdminHash = await hash('admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      nome: 'Admin Master',
      email: 'admin@catalogo.com',
      senhaHash: senhaAdminHash,
      role: 'ADMIN',
      ativo: true,
    },
  });
  console.log('🔑 Usuário ADMIN criado: admin@catalogo.com | senha: admin@123');

  const senhaStaffHash = await hash('staff@123', 12);
  const staff = await prisma.user.create({
    data: {
      nome: 'Funcionário Padrão',
      email: 'staff@catalogo.com',
      senhaHash: senhaStaffHash,
      role: 'STAFF',
      ativo: true,
    },
  });
  console.log('🔑 Usuário STAFF criado: staff@catalogo.com | senha: staff@123');

  // --- Criar Carros ---
  const corolla = await prisma.car.create({
    data: {
      titulo: 'Corolla XEi 2.0 2023',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      km: 15000,
      cor: 'Branco Perolizado',
      cambio: 'AUTOMATICO',
      combustivel: 'FLEX',
      portas: 4,
      precoCentavos: 14500000, // R$ 145.000,00
      descricao: 'Carro impecável, único dono, todas as revisões feitas na concessionária.',
      ativo: true,
    },
  });
  console.log(`🚗 Carro criado: ${corolla.titulo}`);

  const civic = await prisma.car.create({
    data: {
      titulo: 'Civic Sport 2.0 2020',
      marca: 'Honda',
      modelo: 'Civic',
      ano: 2020,
      km: 45000,
      cor: 'Preto',
      cambio: 'AUTOMATICO',
      combustivel: 'GASOLINA',
      portas: 4,
      precoCentavos: 11500000, // R$ 115.000,00
      descricao: 'Pneus novos, sem detalhes na pintura.',
      ativo: true,
    },
  });
  console.log(`🚗 Carro criado: ${civic.titulo}`);
  
  // Carro inativo para testes
  const fusca = await prisma.car.create({
    data: {
      titulo: 'Fusca 1300 1975',
      marca: 'Volkswagen',
      modelo: 'Fusca',
      ano: 1975,
      km: 250000,
      cor: 'Azul',
      cambio: 'MANUAL',
      combustivel: 'GASOLINA',
      portas: 2,
      precoCentavos: 2500000,
      descricao: 'Relíquia, para colecionadores.',
      ativo: false, // Inativo!
    },
  });
  console.log(`🚗 Carro INATIVO criado: ${fusca.titulo}`);

  // --- Criar Imagens para o Corolla ---
  await prisma.carImage.createMany({
    data: [
      {
        carId: corolla.id,
        url: 'https://example.com/corolla_frente.jpg',
        storagePath: 'fake/path/corolla_frente.jpg',
        capa: true,
        ordem: 0,
      },
      {
        carId: corolla.id,
        url: 'https://example.com/corolla_interior.jpg',
        storagePath: 'fake/path/corolla_interior.jpg',
        capa: false,
        ordem: 1,
      },
    ],
  });
  console.log(`🖼️ Imagens fakes criadas para o Corolla.`);

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });