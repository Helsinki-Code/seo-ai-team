-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "customDomain" TEXT,
    "brandingLogoUrl" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Website" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "domainName" TEXT,
    "gscConnected" BOOLEAN NOT NULL DEFAULT false,
    "gscPropertyId" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteData" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "dataType" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GscData" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" DECIMAL(5,4) NOT NULL,
    "avgPosition" DECIMAL(5,2) NOT NULL,
    "date" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GscData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "currentTaskId" INTEGER,
    "memory" JSONB,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" INTEGER,
    "resultData" JSONB,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "fromAgentId" INTEGER,
    "toAgentId" INTEGER,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "monthlySearchVolume" INTEGER,
    "searchDifficulty" INTEGER,
    "competitionLevel" TEXT,
    "searchIntent" TEXT,
    "trends" TEXT,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerpResearch" (
    "id" SERIAL NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "searchIntent" TEXT NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "estimatedTraffic" TEXT,
    "competitors" JSONB NOT NULL,
    "peopleAlsoAsk" TEXT[],
    "aiOverview" TEXT,
    "strategicInsights" TEXT[],
    "contentGaps" TEXT[],
    "quickWins" TEXT[],
    "rankingFactors" TEXT[],
    "contentRecommendations" JSONB,
    "researchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "websiteId" INTEGER NOT NULL,

    CONSTRAINT "SerpResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "createdByAgentId" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT,
    "slug" TEXT,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER,
    "readingTime" INTEGER,
    "images" JSONB,
    "seoScore" INTEGER,
    "keywordDensity" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "wordPressPostId" INTEGER,
    "linkedInPostId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "contentPieceId" INTEGER,
    "currentPosition" INTEGER NOT NULL,
    "previousPosition" INTEGER,
    "positionChange" INTEGER,
    "visibility" INTEGER,
    "estimatedTraffic" INTEGER,
    "trend" TEXT,
    "needsOptimization" BOOLEAN NOT NULL DEFAULT false,
    "lastOptimizationAt" TIMESTAMP(3),
    "trackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlink" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT,
    "domainRating" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdByAgentId" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "organicTraffic" INTEGER NOT NULL,
    "keywordRankingsAvg" DECIMAL(5,2),
    "domainAuthority" INTEGER,
    "newBacklinks" INTEGER NOT NULL,
    "contentPublished" INTEGER NOT NULL,
    "recordedDate" DATE NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "executiveSummary" TEXT,
    "winsOfWeek" TEXT[],
    "challenges" TEXT[],
    "nextWeekPriorities" TEXT[],
    "performanceSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionDetails" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonetizationConfig" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "amazonPartnerId" TEXT,
    "amazonSecretKey" TEXT,
    "shareASaleAffiliateId" TEXT,
    "shareASaleApiToken" TEXT,
    "cjPublisherId" TEXT,
    "cjApiKey" TEXT,
    "clickBankAccountName" TEXT,
    "clickBankApiKey" TEXT,
    "googleAdSenseId" TEXT,
    "emailProvider" TEXT,
    "emailProviderApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonetizationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateRevenue" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "recordedDate" DATE NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailList" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "growthRate" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTracking" (
    "id" SERIAL NOT NULL,
    "emailListId" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "clickedLink" TEXT,
    "repliedAt" TIMESTAMP(3),
    "replyText" TEXT,
    "sentiment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "EmailTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestPostingCampaign" (
    "id" SERIAL NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "campaignName" TEXT NOT NULL,
    "targetNiche" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "totalTargets" INTEGER NOT NULL DEFAULT 0,
    "researchedCount" INTEGER NOT NULL DEFAULT 0,
    "outreachedCount" INTEGER NOT NULL DEFAULT 0,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestPostingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestPostingTarget" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "domainAuthority" INTEGER,
    "relevanceScore" DECIMAL(5,2) NOT NULL,
    "contactEmail" TEXT,
    "guestPostUrl" TEXT,
    "guidelinesUrl" TEXT,
    "guidelinesContent" TEXT,
    "estimatedMonthlyTraffic" INTEGER,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "outreachCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedUrl" TEXT,
    "publishedDate" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestPostingTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEmail" (
    "id" SERIAL NOT NULL,
    "targetId" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "clickedLink" TEXT,
    "repliedAt" TIMESTAMP(3),
    "replyText" TEXT,
    "sentiment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "OutreachEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "Website_organizationId_idx" ON "Website"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Website_organizationId_url_key" ON "Website"("organizationId", "url");

-- CreateIndex
CREATE INDEX "WebsiteData_websiteId_dataType_idx" ON "WebsiteData"("websiteId", "dataType");

-- CreateIndex
CREATE INDEX "GscData_websiteId_date_idx" ON "GscData"("websiteId", "date");

-- CreateIndex
CREATE INDEX "Agent_websiteId_status_idx" ON "Agent"("websiteId", "status");

-- CreateIndex
CREATE INDEX "AgentTask_agentId_status_idx" ON "AgentTask"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentMessage_websiteId_createdAt_idx" ON "AgentMessage"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "Keyword_websiteId_type_idx" ON "Keyword"("websiteId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_websiteId_keyword_key" ON "Keyword"("websiteId", "keyword");

-- CreateIndex
CREATE INDEX "SerpResearch_keywordId_idx" ON "SerpResearch"("keywordId");

-- CreateIndex
CREATE INDEX "SerpResearch_websiteId_idx" ON "SerpResearch"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "SerpResearch_keywordId_key" ON "SerpResearch"("keywordId");

-- CreateIndex
CREATE INDEX "ContentPiece_websiteId_status_idx" ON "ContentPiece"("websiteId", "status");

-- CreateIndex
CREATE INDEX "ContentPiece_websiteId_keyword_idx" ON "ContentPiece"("websiteId", "keyword");

-- CreateIndex
CREATE INDEX "Ranking_websiteId_keywordId_idx" ON "Ranking"("websiteId", "keywordId");

-- CreateIndex
CREATE INDEX "Ranking_websiteId_trackedAt_idx" ON "Ranking"("websiteId", "trackedAt");

-- CreateIndex
CREATE INDEX "Backlink_websiteId_status_idx" ON "Backlink"("websiteId", "status");

-- CreateIndex
CREATE INDEX "PerformanceMetric_websiteId_recordedDate_idx" ON "PerformanceMetric"("websiteId", "recordedDate");

-- CreateIndex
CREATE INDEX "WeeklyReport_websiteId_weekStartDate_idx" ON "WeeklyReport"("websiteId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ApprovalRequest_websiteId_status_idx" ON "ApprovalRequest"("websiteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_idx" ON "ApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "MonetizationConfig_websiteId_idx" ON "MonetizationConfig"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "MonetizationConfig_websiteId_key" ON "MonetizationConfig"("websiteId");

-- CreateIndex
CREATE INDEX "AffiliateRevenue_configId_source_recordedDate_idx" ON "AffiliateRevenue"("configId", "source", "recordedDate");

-- CreateIndex
CREATE INDEX "EmailList_configId_idx" ON "EmailList"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailList_configId_provider_key" ON "EmailList"("configId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTracking_messageId_key" ON "EmailTracking"("messageId");

-- CreateIndex
CREATE INDEX "EmailTracking_emailListId_status_idx" ON "EmailTracking"("emailListId", "status");

-- CreateIndex
CREATE INDEX "EmailTracking_recipientEmail_idx" ON "EmailTracking"("recipientEmail");

-- CreateIndex
CREATE INDEX "GuestPostingCampaign_websiteId_status_idx" ON "GuestPostingCampaign"("websiteId", "status");

-- CreateIndex
CREATE INDEX "GuestPostingTarget_campaignId_status_idx" ON "GuestPostingTarget"("campaignId", "status");

-- CreateIndex
CREATE INDEX "GuestPostingTarget_domain_idx" ON "GuestPostingTarget"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachEmail_messageId_key" ON "OutreachEmail"("messageId");

-- CreateIndex
CREATE INDEX "OutreachEmail_targetId_status_idx" ON "OutreachEmail"("targetId", "status");

-- CreateIndex
CREATE INDEX "OutreachEmail_recipientEmail_idx" ON "OutreachEmail"("recipientEmail");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteData" ADD CONSTRAINT "WebsiteData_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GscData" ADD CONSTRAINT "GscData_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerpResearch" ADD CONSTRAINT "SerpResearch_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerpResearch" ADD CONSTRAINT "SerpResearch_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_createdByAgentId_fkey" FOREIGN KEY ("createdByAgentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlink" ADD CONSTRAINT "Backlink_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlink" ADD CONSTRAINT "Backlink_createdByAgentId_fkey" FOREIGN KEY ("createdByAgentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonetizationConfig" ADD CONSTRAINT "MonetizationConfig_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateRevenue" ADD CONSTRAINT "AffiliateRevenue_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MonetizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailList" ADD CONSTRAINT "EmailList_configId_fkey" FOREIGN KEY ("configId") REFERENCES "MonetizationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTracking" ADD CONSTRAINT "EmailTracking_emailListId_fkey" FOREIGN KEY ("emailListId") REFERENCES "EmailList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestPostingCampaign" ADD CONSTRAINT "GuestPostingCampaign_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestPostingTarget" ADD CONSTRAINT "GuestPostingTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GuestPostingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "GuestPostingTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
