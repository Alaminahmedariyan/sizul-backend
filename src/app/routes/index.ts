import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/user/user.routes";
import { staffRoutes } from "../modules/staff/staff.routes";
import { clientRoutes } from "../modules/client/client.routes";
import { serviceRoutes } from "../modules/service/service.routes";
import { pricingPlanRoutes } from "../modules/pricingPlan/pricingPlan.routes";
import { leadRoutes } from "../modules/lead/lead.routes";
import { consultationRoutes } from "../modules/consultation/consultation.routes";
import { proposalRoutes } from "../modules/proposal/proposal.routes";
import { projectRoutes } from "../modules/project/project.routes";
import { projectMemberRoutes } from "../modules/projectMember/projectMember.routes";
import { projectMilestoneRoutes } from "../modules/projectMilestone/projectMilestone.routes";
import { projectTaskRoutes } from "../modules/projectTask/projectTask.routes";
import { projectFileRoutes } from "../modules/projectFile/projectFile.routes";
import { clientReviewRoutes } from "../modules/clientReview/clientReview.routes";
import { clientAppreciationRoutes } from "../modules/clientAppreciation/clientAppreciation.routes";
import { caseStudyRoutes } from "../modules/caseStudy/caseStudy.routes";
import { testimonialRoutes } from "../modules/testimonial/testimonial.routes";
import { faqRoutes } from "../modules/faq/faq.routes";
import { blogCategoryRoutes } from "../modules/blogCategory/blogCategory.routes";
import { blogTagRoutes } from "../modules/blogTag/blogTag.routes";
import { blogPostRoutes } from "../modules/blogPost/blogPost.routes";
import { mediaRoutes } from "../modules/media/media.routes";
import { keywordRankingRoutes } from "../modules/seo/keywordRanking.routes";
import { backlinkRoutes } from "../modules/seo/backlink.routes";
import { citationRoutes } from "../modules/seo/citation.routes";
import { googleBusinessProfileRoutes } from "../modules/seo/googleBusinessProfile.routes";
import { seoAuditRoutes } from "../modules/seo/seoAudit.routes";
import { performanceReportRoutes } from "../modules/seo/performanceReport.routes";
import { reviewMonitorRoutes } from "../modules/seo/reviewMonitor.routes";
import { serviceAreaRoutes } from "../modules/seo/serviceArea.routes";
import { callLogRoutes } from "../modules/seo/callLog.routes";
import { trackingConfigRoutes } from "../modules/seo/trackingConfig.routes";
import { contactMessageRoutes } from "../modules/contactMessage/contactMessage.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";
import { siteSettingRoutes } from "../modules/siteSetting/siteSetting.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { portfolioRoutes } from "../modules/portfolio/portfolio.routes";

const router = Router();

const moduleRoutes = [
	{ path: "/auth", route: authRoutes },
	{ path: "/users", route: userRoutes },
	{ path: "/staff", route: staffRoutes },
	{ path: "/clients", route: clientRoutes },
	{ path: "/services", route: serviceRoutes },
	{ path: "/pricing-plans", route: pricingPlanRoutes },
	{ path: "/leads", route: leadRoutes },
	{ path: "/consultations", route: consultationRoutes },
	{ path: "/proposals", route: proposalRoutes },
	{ path: "/projects", route: projectRoutes },
	{ path: "/project-members", route: projectMemberRoutes },
	{ path: "/project-milestones", route: projectMilestoneRoutes },
	{ path: "/project-tasks", route: projectTaskRoutes },
	{ path: "/project-files", route: projectFileRoutes },
	{ path: "/client-reviews", route: clientReviewRoutes },
	{ path: "/client-appreciations", route: clientAppreciationRoutes },
	{ path: "/portfolio", route: portfolioRoutes },
	{ path: "/case-studies", route: caseStudyRoutes },
	{ path: "/testimonials", route: testimonialRoutes },
	{ path: "/faqs", route: faqRoutes },
	{ path: "/blog-categories", route: blogCategoryRoutes },
	{ path: "/blog-tags", route: blogTagRoutes },
	{ path: "/blog-posts", route: blogPostRoutes },
	{ path: "/media", route: mediaRoutes },
	{ path: "/seo/keyword-rankings", route: keywordRankingRoutes },
	{ path: "/seo/backlinks", route: backlinkRoutes },
	{ path: "/seo/citations", route: citationRoutes },
	{ path: "/seo/google-business-profiles", route: googleBusinessProfileRoutes },
	{ path: "/seo/audits", route: seoAuditRoutes },
	{ path: "/seo/performance-reports", route: performanceReportRoutes },
	{ path: "/seo/review-monitors", route: reviewMonitorRoutes },
	{ path: "/seo/service-areas", route: serviceAreaRoutes },
	{ path: "/seo/call-logs", route: callLogRoutes },
	{ path: "/seo/tracking-configs", route: trackingConfigRoutes },
	{ path: "/contact-messages", route: contactMessageRoutes },
	{ path: "/notifications", route: notificationRoutes },
	{ path: "/site-settings", route: siteSettingRoutes },
	{ path: "/payments", route: paymentRoutes },
];

for (const { path, route } of moduleRoutes) {
	router.use(path, route);
}

export const globalRoutes = router;