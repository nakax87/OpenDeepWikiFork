'use server'
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import 'katex/dist/katex.min.css';

// Markdown 编译器导入
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// 直接导入工具函数，避免导入客户端组件
import { extractHeadings, createAnchorItems } from '../../../components/document/utils/headingUtils';

// 导入文档服务和类型
import { documentById, getWarehouseOverview } from '../../../services/warehouseService';

// 导入客户端组件和服务端组件
import DocumentPageClient from './DocumentPageClient';
import { DocumentData, Heading } from './types';

// 编译 Markdown 内容为 HTML
async function compileMarkdownToHtml(markdown: string): Promise<string> {
  try {
    if (!markdown || markdown.trim() === '') {
      return '<p>暂无内容</p>';
    }
  } catch (error) {
    console.error('Markdown 编译错误:', error);
    return `
      <div style="
        background-color: #fff2f0; 
        border: 1px solid #ffccc7; 
        border-radius: 6px; 
        padding: 16px;
        color: #a8071a;
        margin: 16px 0;
      ">
        <h4 style="margin: 0 0 8px 0;">Markdown 编译失败</h4>
        <p style="margin: 0; font-size: 14px;">
          ${error instanceof Error ? error.message : '未知错误'}
        </p>
      </div>
    `;
  }
}

// 生成SEO友好的描述
function generateSEODescription(document: DocumentData, owner: string, name: string, path: string): string {
  if (document.description) {
    return document.description;
  }
  
  // 从内容中提取前150个字符作为描述
  if (document.content) {
    const plainText = document.content
      .replace(/[#*`_~\[\]()]/g, '') // 移除Markdown标记
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim();
    
    if (plainText.length > 150) {
      return plainText.substring(0, 147) + '...';
    }
    return plainText;
  }
  
  return `${owner}/${name} 项目中的 ${path} 文档 - 详细的技术文档和使用指南`;
}

// 生成关键词
function generateKeywords(document: DocumentData, owner: string, name: string, path: string): string {
  const keywords = [
    owner,
    name,
    path.split('/').pop()?.replace(/\.(md|txt|rst)$/i, ''), // 文件名（去除扩展名）
    '文档',
    '技术文档',
    '开源项目',
    'GitHub',
    'Gitee'
  ].filter(Boolean);
  
  // 从标题中提取关键词
  if (document.title) {
    const titleWords = document.title.split(/[\s\-_]+/).filter(word => word.length > 2);
    keywords.push(...titleWords);
  }
  
  // 从路径中提取关键词
  const pathWords = path.split('/').filter(word => word.length > 2);
  keywords.push(...pathWords);
  
  return [...new Set(keywords)].join(', ');
}

// 生成结构化数据
function generateStructuredData(document: DocumentData, owner: string, name: string, path: string, branch?: string) {
  const url = `/${owner}/${name}/${path}${branch ? `?branch=${branch}` : ''}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: document.title || `${path} - ${name}`,
    description: generateSEODescription(document, owner, name, path),
    author: {
      '@type': 'Organization',
      name: owner
    },
    publisher: {
      '@type': 'Organization',
      name: 'KoalaWiki'
    },
    dateCreated: document.createdAt,
    dateModified: document.updatedAt || document.createdAt,
    url: url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    isPartOf: {
      '@type': 'SoftwareSourceCode',
      name: name,
      codeRepository: document.address || `https://github.com/${owner}/${name}`,
      programmingLanguage: 'Various'
    },
    keywords: generateKeywords(document, owner, name, path),
    inLanguage: 'zh-CN',
    genre: ['技术文档', '软件文档', '开发文档']
  };
}

// 检测是否为搜索引擎爬虫
function isSearchEngineBot(userAgent: string): boolean {
  const searchEngineBots = [
    'googlebot',
    'bingbot',
    'slurp', // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'sogou',
    'exabot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegram',
    'applebot',
    'pingdom',
    'uptimerobot'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return searchEngineBots.some(bot => lowerUserAgent.includes(bot));
}

// 生成页面元数据
export async function generateMetadata({ 
  params, 
  searchParams 
}: {
  params: Promise<{ owner: string; name: string; path: string }>;
  searchParams: Promise<{ branch?: string }>;
}): Promise<Metadata> {
  const { owner, name, path } = await params;
  const { branch } = await searchParams;

  try {
    // 并行获取文档数据和仓库概览
    const [documentResponse, overviewResponse] = await Promise.all([
      documentById(owner, name, path, branch),
      getWarehouseOverview(owner, name, branch).catch(() => null)
    ]);
    
    if (documentResponse.isSuccess && documentResponse.data) {
      const document = documentResponse.data as DocumentData;
      const overview = overviewResponse?.data;
      
      const title = document.title || `${path} - ${name}`;
      const description = generateSEODescription(document, owner, name, path);
      const keywords = generateKeywords(document, owner, name, path);
      const url = `/${owner}/${name}/${path}${branch ? `?branch=${branch}` : ''}`;
      
      // 生成更丰富的元数据
      return {
        title: `${title} | ${owner}/${name} - KoalaWiki`,
        description,
        keywords,
        authors: [{ name: owner }],
        creator: owner,
        publisher: 'KoalaWiki',
        formatDetection: {
          email: false,
          address: false,
          telephone: false,
        },
        metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://opendeep.wiki'),
        alternates: {
          canonical: url,
        },
        openGraph: {
          title: `${title} | ${owner}/${name}`,
          description,
          type: 'article',
          url,
          siteName: 'KoalaWiki',
          locale: 'zh_CN',
          images: [
            {
              url: `/api/og?title=${encodeURIComponent(title)}&owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`,
              width: 1200,
              height: 630,
              alt: title,
            }
          ],
          authors: [owner],
          publishedTime: document.createdAt,
          modifiedTime: document.updatedAt || document.createdAt,
          section: '技术文档',
          tags: keywords.split(', '),
        },
        twitter: {
          card: 'summary_large_image',
          title: `${title} | ${owner}/${name}`,
          description,
          creator: `@${owner}`,
          images: [`/api/og?title=${encodeURIComponent(title)}&owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`],
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
          yandex: process.env.YANDEX_VERIFICATION,
          yahoo: process.env.YAHOO_SITE_VERIFICATION,
        },
        category: '技术文档',
        classification: '软件开发',
        other: {
          'article:author': owner,
          'article:section': '技术文档',
          'article:tag': keywords,
          'og:image:alt': title,
          'twitter:label1': '作者',
          'twitter:data1': owner,
          'twitter:label2': '项目',
          'twitter:data2': name,
        },
      };
    }
  } catch (error) {
    console.error('生成元数据时出错:', error);
  }

  // 默认元数据（SEO优化版本）
  const defaultTitle = `${path} - ${name} | ${owner} - KoalaWiki`;
  const defaultDescription = `查看 ${owner}/${name} 项目中的 ${path} 文档。KoalaWiki 提供详细的技术文档、API参考和使用指南，帮助开发者快速理解和使用开源项目。`;
  
  return {
    title: defaultTitle,
    description: defaultDescription,
    keywords: `${owner}, ${name}, ${path}, 文档, 技术文档, 开源项目, GitHub, API文档, 使用指南`,
    authors: [{ name: owner }],
    creator: owner,
    publisher: 'KoalaWiki',
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://opendeep.wiki'),
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      type: 'article',
      siteName: 'KoalaWiki',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary',
      title: defaultTitle,
      description: defaultDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function DocumentPage({ 
  params, 
  searchParams 
}: {
  params: Promise<{ owner: string; name: string; path: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { owner, name, path } = await params;
  const { branch } = await searchParams;

  // 获取请求头信息
  const headersList = await headers();

  // 在服务端获取文档数据
  let document: DocumentData | null = null;
  let error: string | null = null;
  let headings: Heading[] = [];
  let structuredData: any = null;

  try {
    const response = await documentById(owner, name, path, branch);
    if (response.isSuccess && response.data) {
      document = response.data as DocumentData;
      // 提取标题作为目录
      headings = extractHeadings(response.data.content);
      // 生成结构化数据
      structuredData = generateStructuredData(document, owner, name, path, branch);
    } else {
      error = response.message || '无法获取文档内容，请检查文档路径是否正确';
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '网络异常，请稍后重试';
    error = `获取文档时发生错误：${errorMsg}`;
    console.error(err);
  }

  // 如果有错误且是404类型的错误，使用Next.js的notFound
  if (error && (error.includes('404') || error.includes('未找到'))) {
    notFound();
  }
  // 生成目录锚点项
  const anchorItems = createAnchorItems(headings);

  // 共同的props
  const commonProps = {
    document,
    error,
    headings,
    anchorItems,
    owner,
    name,
    path,
    branch
  };

  return (
    <>
      <DocumentPageClient {...commonProps} />
    </>
  );
}