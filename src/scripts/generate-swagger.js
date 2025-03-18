const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Carregar configurações
require('dotenv').config();

// Definição de componentes reutilizáveis (simplificado para o exemplo)
const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }
  },
  schemas: {
    // Definições de schemas aqui...
  },
  // Outras definições...
};

// Opções do Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Weihu',
      version: '1.0.0',
      description: 'Documentação da API Weihu para gerenciamento de tarefas no estilo Kanban'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}${process.env.API_PREFIX || '/api/v1'}`,
        description: 'Servidor de Desenvolvimento',
      }
    ],
    components,
    tags: [
      { name: 'Auth', description: 'Endpoints para autenticação e gestão de sessão' },
      { name: 'Users', description: 'Endpoints para gerenciamento de usuários' },
      { name: 'Tasks', description: 'Endpoints para gerenciamento de tarefas' },
      { name: 'Comments', description: 'Endpoints para gerenciamento de comentários em tarefas' },
      { name: 'Activities', description: 'Endpoints para registro e consulta de atividades' },
    ],
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/docs/**/*.yaml'], // Inclui arquivos YAML separados
};

// Gerar especificação do Swagger
const specs = swaggerJsdoc(options);

// Diretório de saída
const outDir = path.join(__dirname, '..', 'docs', 'swagger');

// Criar diretório se não existir
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Salvar especificação como JSON
fs.writeFileSync(
  path.join(outDir, 'swagger.json'),
  JSON.stringify(specs, null, 2),
  'utf8'
);

// Salvar especificação como YAML para GitLab/GitHub Pages
const YAML = require('yaml');
fs.writeFileSync(
  path.join(outDir, 'swagger.yaml'),
  YAML.stringify(specs),
  'utf8'
);

console.log(`Documentação Swagger gerada com sucesso em: ${outDir}`);

// Gerar página HTML estática para a documentação
const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();

// Copiar arquivos estáticos do Swagger UI
const files = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-32x32.png',
  'favicon-16x16.png'
];

files.forEach(file => {
  fs.copyFileSync(
    path.join(swaggerUiAssetPath, file),
    path.join(outDir, file)
  );
});

// Criar arquivo HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Weihu - Documentação</title>
  <link rel="stylesheet" type="text/css" href="swagger-ui.css" />
  <link rel="icon" type="image/png" href="favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="favicon-16x16.png" sizes="16x16" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="swagger-ui-bundle.js"></script>
  <script src="swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(specs)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
console.log(`Página HTML de documentação gerada: ${path.join(outDir, 'index.html')}`);