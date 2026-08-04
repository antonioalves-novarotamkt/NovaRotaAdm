const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@novarota.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@novarota.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Usuário admin pronto:", admin.email);

  const clientsData = [
    { name: "Carlos Mendonça", company: "TechBrasil Ltda", email: "carlos@techbrasil.com.br", phone: "(11) 99123-4567", website: "techbrasil.com.br", status: "ACTIVE", contractValue: 15000, city: "São Paulo", state: "SP" },
    { name: "Ana Lima", company: "StartupXYZ", email: "ana@startupxyz.io", phone: "(21) 98765-3210", website: "startupxyz.io", status: "ACTIVE", contractValue: 8500, city: "Rio de Janeiro", state: "RJ" },
    { name: "Roberto Silva", company: "Loja Moderna", email: "roberto@lojamoderna.com", phone: "(31) 97654-8901", website: "lojamoderna.com", status: "ACTIVE", contractValue: 4200, city: "Belo Horizonte", state: "MG" },
    { name: "Mariana Costa", company: "Restaurante Bella", email: "mariana@bellaristorante.com.br", phone: "(11) 93456-7890", website: "bellaristorante.com.br", status: "INACTIVE", contractValue: 3000, city: "São Paulo", state: "SP" },
    { name: "Fernanda Rocha", company: "FashionHub", email: "fernanda@fashionhub.com.br", phone: "(51) 99012-3456", website: "fashionhub.com.br", status: "PROSPECT", contractValue: 6000, city: "Porto Alegre", state: "RS" },
  ];

  for (const data of clientsData) {
    await prisma.client.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
  }
  console.log(`${clientsData.length} clientes prontos.`);

  const techBrasil = await prisma.client.findUnique({ where: { email: "carlos@techbrasil.com.br" } });
  const startupXyz = await prisma.client.findUnique({ where: { email: "ana@startupxyz.io" } });

  if (techBrasil) {
    await prisma.project.upsert({
      where: { id: "seed-project-1" },
      update: {},
      create: {
        id: "seed-project-1",
        name: "Campanha Google Ads Q1 2024",
        status: "IN_PROGRESS",
        priority: "HIGH",
        budget: 8000,
        clientId: techBrasil.id,
        managerId: admin.id,
      },
    });

    await prisma.invoice.upsert({
      where: { number: "NF-2024-001" },
      update: {},
      create: {
        number: "NF-2024-001",
        clientId: techBrasil.id,
        amount: 15000,
        tax: 1500,
        total: 16500,
        status: "PAID",
        dueDate: new Date("2024-01-15"),
        paidAt: new Date("2024-01-12"),
      },
    });

    await prisma.contract.upsert({
      where: { id: "seed-contract-1" },
      update: {},
      create: {
        id: "seed-contract-1",
        title: "Contrato de Gestão de Mídia Paga",
        clientId: techBrasil.id,
        value: 15000,
        startDate: new Date("2024-01-01"),
        status: "ACTIVE",
      },
    });
  }

  if (startupXyz) {
    await prisma.invoice.upsert({
      where: { number: "NF-2024-002" },
      update: {},
      create: {
        number: "NF-2024-002",
        clientId: startupXyz.id,
        amount: 8500,
        tax: 850,
        total: 9350,
        status: "PENDING",
        dueDate: new Date("2024-02-10"),
      },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
