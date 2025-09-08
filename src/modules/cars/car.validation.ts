import { z } from 'zod';

// As enums devem corresponder às do schema.prisma
const CambioType = z.enum(['MANUAL', 'AUTOMATICO']);
const CombustivelType = z.enum([
  'GASOLINA',
  'ETANOL',
  'FLEX',
  'DIESEL',
  'HIBRIDO',
  'ELETRICO',
]);

// Schema para os query params da rota GET /cars
export const getCarsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anoMin: z.coerce.number().int().optional(),
  anoMax: z.coerce.number().int().optional(),
  precoMin: z.coerce.number().int().optional(),
  precoMax: z.coerce.number().int().optional(),
  kmMax: z.coerce.number().int().optional(),
  cambio: CambioType.optional(),
  combustivel: CombustivelType.optional(),
  ordenarPor: z.enum(['preco', 'ano', 'km', 'createdAt']).default('createdAt'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

// Schema para a criação de um carro (será usado nos endpoints de staff)
const currentYear = new Date().getFullYear();
export const createCarSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(120),
  descricao: z.string().max(2000).optional(),
  marca: z.string().min(1).max(60),
  modelo: z.string().min(1).max(60),
  ano: z.coerce.number().int().min(1950).max(currentYear + 1),
  km: z.coerce.number().int().min(0),
  cambio: CambioType,
  combustivel: CombustivelType,
  cor: z.string().min(1),
  portas: z.coerce.number().int().min(2).max(5),
  precoCentavos: z.coerce.number().int().min(0),
});

// Schema para atualização (todos os campos são opcionais)
export const updateCarSchema = createCarSchema.partial();

// Defina os tipos de imagem permitidos em uma constante separada
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Schema para gerar a signed URL
export const createSignedUrlSchema = z.object({
  contentType: z.union(allowedImageTypes.map((t) => z.literal(t)))
    .refine((val) => allowedImageTypes.includes(val), {
      message: 'Tipo de arquivo inválido. Use apenas JPEG, PNG ou WebP.',
    }),
  contentLength: z.coerce.number().max(5 * 1024 * 1024, {
    // 5MB
    message: 'A imagem não pode ter mais de 5MB.',
  }),
});

// Schema para confirmar o upload
export const confirmUploadSchema = z.object({
  storagePath: z.string().min(1, 'O caminho do arquivo no storage é obrigatório.'),
});

// Schema para atualizar uma imagem (capa/ordem)
export const updateImageSchema = z.object({
  capa: z.boolean().optional(),
  ordem: z.number().int().min(0).optional(),
});
