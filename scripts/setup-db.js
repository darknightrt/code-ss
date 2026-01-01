#!/usr/bin/env node

/**
 * 数据库设置脚本
 * 帮助用户快速设置本地开发环境
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 CodeSensei 数据库设置向导\n');

// 检查 Supabase CLI 是否安装
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    console.log('✅ Supabase CLI 已安装');
    return true;
  } catch (error) {
    console.log('❌ Supabase CLI 未安装');
    console.log('\n请先安装 Supabase CLI:');
    console.log('  npm install -g supabase');
    console.log('  或访问: https://supabase.com/docs/guides/cli\n');
    return false;
  }
}

// 生成随机密钥
function generateKey(bytes = 32, encoding = 'hex') {
  return crypto.randomBytes(bytes).toString(encoding);
}

// 检查并创建 .env.local 文件
function setupEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local 文件已存在，跳过创建');
    return;
  }

  console.log('📝 创建 .env.local 文件...');

  const authSecret = generateKey(32, 'base64');
  const encryptionKey = generateKey(32, 'hex');

  const envContent = `# Supabase Configuration (本地开发)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-start
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-start

# NextAuth Configuration
AUTH_SECRET=${authSecret}
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (Optional)
# GITHUB_ID=your-github-client-id
# GITHUB_SECRET=your-github-client-secret

# Encryption Key
ENCRYPTION_KEY=${encryptionKey}

# Rate Limiting (Optional - Upstash Redis)
# UPSTASH_REDIS_REST_URL=your-redis-url
# UPSTASH_REDIS_REST_TOKEN=your-redis-token
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local 文件已创建');
  console.log('   AUTH_SECRET 和 ENCRYPTION_KEY 已自动生成\n');
}

// 初始化 Supabase
function initSupabase() {
  console.log('🔧 初始化 Supabase 项目...');
  
  try {
    // 检查是否已经初始化
    if (fs.existsSync(path.join(process.cwd(), 'supabase', '.gitignore'))) {
      console.log('⚠️  Supabase 已初始化，跳过');
      return true;
    }

    execSync('supabase init', { stdio: 'inherit' });
    console.log('✅ Supabase 初始化完成\n');
    return true;
  } catch (error) {
    console.error('❌ Supabase 初始化失败:', error.message);
    return false;
  }
}

// 启动 Supabase
function startSupabase() {
  console.log('🚀 启动本地 Supabase 服务...');
  console.log('   这可能需要几分钟时间...\n');
  
  try {
    execSync('supabase start', { stdio: 'inherit' });
    console.log('\n✅ Supabase 服务已启动');
    console.log('\n📋 请将上面输出的 API URL、anon key、service_role key 和 JWT secret');
    console.log('   复制到 .env.local 文件中\n');
    return true;
  } catch (error) {
    console.error('❌ Supabase 启动失败:', error.message);
    return false;
  }
}

// 应用数据库迁移
function applyMigrations() {
  console.log('📦 应用数据库迁移...');
  
  try {
    execSync('supabase db reset', { stdio: 'inherit' });
    console.log('✅ 数据库迁移已应用\n');
    return true;
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    return false;
  }
}

// 生成 TypeScript 类型
function generateTypes() {
  console.log('🔨 生成 TypeScript 类型定义...');
  
  try {
    const typesPath = path.join(process.cwd(), 'src', 'lib', 'db', 'types.ts');
    execSync(`supabase gen types typescript --local > ${typesPath}`, { stdio: 'inherit' });
    console.log('✅ TypeScript 类型已生成\n');
    return true;
  } catch (error) {
    console.error('❌ 类型生成失败:', error.message);
    console.log('   你可以稍后手动运行: supabase gen types typescript --local > src/lib/db/types.ts\n');
    return false;
  }
}

// 主函数
async function main() {
  // 1. 检查 Supabase CLI
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }

  console.log('');

  // 2. 创建 .env.local 文件
  setupEnvFile();

  // 3. 初始化 Supabase
  if (!initSupabase()) {
    process.exit(1);
  }

  // 4. 启动 Supabase
  if (!startSupabase()) {
    process.exit(1);
  }

  console.log('⏸️  请先更新 .env.local 文件中的 Supabase 配置');
  console.log('   然后按回车继续...');
  
  // 等待用户按回车
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // 5. 应用迁移
  if (!applyMigrations()) {
    process.exit(1);
  }

  // 6. 生成类型
  generateTypes();

  console.log('🎉 数据库设置完成！\n');
  console.log('下一步:');
  console.log('  1. 运行 npm run dev 启动开发服务器');
  console.log('  2. 访问 http://localhost:3000');
  console.log('  3. 访问 http://localhost:54323 查看 Supabase Studio\n');
  console.log('详细文档: docs/database-setup.md\n');
}

// 运行主函数
main().catch(error => {
  console.error('❌ 设置失败:', error);
  process.exit(1);
});
