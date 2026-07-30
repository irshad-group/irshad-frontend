/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80027
 Source Host           : localhost:3306
 Source Schema         : irshad_db_dev

 Target Server Type    : MySQL
 Target Server Version : 80027
 File Encoding         : 65001

 Date: 31/08/2022 16:21:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `msg` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dest_type` int(0) NOT NULL COMMENT '0: Proc, 1: Proc Item, 2: Directorate, 3: Ministry',
  `dest_id` int(0) NOT NULL,
  `token` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contact
-- ----------------------------
DROP TABLE IF EXISTS `contact`;
CREATE TABLE `contact`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for directorates
-- ----------------------------
DROP TABLE IF EXISTS `directorates`;
CREATE TABLE `directorates`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ministry_id` int(0) NOT NULL,
  `address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_lat` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_lon` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `working_hours_ar` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `working_hours_en` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `working_hours_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for directorates_prov
-- ----------------------------
DROP TABLE IF EXISTS `directorates_prov`;
CREATE TABLE `directorates_prov`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_ar` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_id` int(0) NOT NULL,
  `gps_lat` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_lon` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for drawer
-- ----------------------------
DROP TABLE IF EXISTS `drawer`;
CREATE TABLE `drawer`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` tinyint(0) NOT NULL COMMENT '0: Not shown in drawer, 1: Drawer Main Item, 2: Drawer Sub item',
  `title_ar` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent` int(0) NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for failed_jobs
-- ----------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for failed_login
-- ----------------------------
DROP TABLE IF EXISTS `failed_login`;
CREATE TABLE `failed_login`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uid` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for faq
-- ----------------------------
DROP TABLE IF EXISTS `faq`;
CREATE TABLE `faq`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_en` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_ar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_kr` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_ar` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize` int(0) NOT NULL COMMENT 'in MB',
  `path` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dest_type` int(0) NOT NULL COMMENT '0: Proc, 2: Proc Items',
  `dest_id` int(0) NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menu
-- ----------------------------
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` tinyint(0) NOT NULL COMMENT '1:Main Item, 2: Sub item',
  `title_ar` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent` int(0) NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for migrations
-- ----------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations`  (
  `id` int(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(0) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of migrations
-- ----------------------------
INSERT INTO `migrations` VALUES (1, '2014_10_12_000000_create_users_table', 1);
INSERT INTO `migrations` VALUES (2, '2014_10_12_100000_create_password_resets_table', 1);
INSERT INTO `migrations` VALUES (3, '2019_08_19_000000_create_failed_jobs_table', 1);
INSERT INTO `migrations` VALUES (4, '2019_12_14_000001_create_personal_access_tokens_table', 1);
INSERT INTO `migrations` VALUES (5, '2022_08_20_104759_create_team_table', 1);
INSERT INTO `migrations` VALUES (6, '2022_08_20_105938_create_slider_table', 1);
INSERT INTO `migrations` VALUES (7, '2022_08_20_110402_create_settings_table', 1);
INSERT INTO `migrations` VALUES (8, '2022_08_20_111038_create_reviews_table', 1);
INSERT INTO `migrations` VALUES (9, '2022_08_20_111452_create_proc_table', 1);
INSERT INTO `migrations` VALUES (10, '2022_08_20_112218_create_proc_items_table', 1);
INSERT INTO `migrations` VALUES (11, '2022_08_20_114133_create_proc_tags_table', 1);
INSERT INTO `migrations` VALUES (12, '2022_08_20_114341_create_partners_table', 1);
INSERT INTO `migrations` VALUES (13, '2022_08_20_115625_create_ministries_table', 1);
INSERT INTO `migrations` VALUES (14, '2022_08_20_131220_create_menu_table', 1);
INSERT INTO `migrations` VALUES (15, '2022_08_20_131716_create_files_table', 1);
INSERT INTO `migrations` VALUES (16, '2022_08_20_132513_create_faq_table', 1);
INSERT INTO `migrations` VALUES (17, '2022_08_20_133022_create_failed_login_table', 1);
INSERT INTO `migrations` VALUES (18, '2022_08_20_133306_create_drawer_table', 1);
INSERT INTO `migrations` VALUES (19, '2022_08_20_134334_create_directorates_table', 1);
INSERT INTO `migrations` VALUES (20, '2022_08_20_134916_create_directorates_prov_table', 1);
INSERT INTO `migrations` VALUES (21, '2022_08_20_135252_create_contact_table', 1);
INSERT INTO `migrations` VALUES (22, '2022_08_20_135734_create_comments_table', 1);

-- ----------------------------
-- Table structure for ministries
-- ----------------------------
DROP TABLE IF EXISTS `ministries`;
CREATE TABLE `ministries`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `krg` int(0) NOT NULL,
  `address` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_lat` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_lon` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 101 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ministries
-- ----------------------------
INSERT INTO `ministries` VALUES (1, 'Consequatur itaque.', 'Doloremque sunt.', 'Eaque nesciunt eius.', 'https://via.placeholder.com/640x480.png/00aa00?text=eum', 0, '3359 Friesen Shoal Apt. 007\nSouth Jake, VT 22818-3688', '-0.594377', '-5.881665', 'http://schowalter.com/qui-odio-repellat-et-doloremque', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (2, 'Alias voluptatum.', 'Et minus vitae.', 'Eligendi voluptatum.', 'https://via.placeholder.com/640x480.png/0022dd?text=reprehenderit', 0, '5776 Millie Road Suite 565\nLake Forest, MD 42132-0302', '-73.258122', '154.984797', 'http://grant.com/velit-velit-expedita-pariatur-voluptatem-sed-suscipit-quis-suscipit.html', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (3, 'Dolorum unde qui.', 'Similique.', 'Voluptatem vitae.', 'https://via.placeholder.com/640x480.png/00cc22?text=explicabo', 0, '50564 Ismael Isle\nJaquelineberg, TX 77102', '6.677094', '-66.7192', 'http://www.leannon.com/nihil-ad-cumque-ad-sit', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (4, 'Voluptas incidunt.', 'Minus reprehenderit.', 'Voluptate ea fugiat.', 'https://via.placeholder.com/640x480.png/001166?text=sunt', 1, '1170 April Squares Apt. 018\nTanyamouth, MS 39037', '87.66223', '-27.845463', 'http://lakin.com/consequatur-libero-voluptas-et-aut-impedit-dicta.html', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (5, 'Voluptatem hic.', 'Culpa vel eaque in.', 'Provident porro et.', 'https://via.placeholder.com/640x480.png/005544?text=aut', 0, '3234 Marvin Terrace\nLake Jeremy, HI 17325-8292', '-62.675517', '142.206538', 'http://kautzer.net/et-ut-et-et-mollitia', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (6, 'Et possimus eos est.', 'Accusantium id ab.', 'Cupiditate nulla.', 'https://via.placeholder.com/640x480.png/00ff00?text=eius', 0, '71632 Justus Turnpike Suite 716\nNorth Richieborough, KS 86341-5043', '-21.353062', '160.834143', 'http://stroman.com/', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (7, 'Voluptatum aliquam.', 'Numquam voluptatem.', 'Neque aut ut.', 'https://via.placeholder.com/640x480.png/006699?text=eum', 0, '6123 Agustina Street\nLuettgenborough, OK 03114', '-73.404699', '-46.582599', 'http://www.kirlin.com/', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (8, 'Quia blanditiis.', 'Nulla voluptatem.', 'Sequi numquam quia.', 'https://via.placeholder.com/640x480.png/00ffbb?text=placeat', 0, '95977 Arnold Squares Apt. 237\nStanfordshire, NE 96813', '6.491272', '-162.553379', 'http://www.kautzer.com/animi-ex-adipisci-dolore-ut-distinctio', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (9, 'Nesciunt est beatae.', 'Expedita illo.', 'Quis dolorum.', 'https://via.placeholder.com/640x480.png/00dd99?text=illo', 1, '172 Valentin Fall\nTrompton, CT 30248', '-52.289243', '142.068365', 'https://schuppe.com/molestiae-dolorum-dolor-at-aut-quia.html', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (10, 'Recusandae aut.', 'Beatae voluptatem.', 'Nostrum.', 'https://via.placeholder.com/640x480.png/00dd11?text=officia', 0, '2880 Wuckert Trail Apt. 096\nMakennaview, CO 91917-8662', '50.177065', '170.258568', 'http://bailey.biz/sit-saepe-et-nihil-sint-voluptatem', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (11, 'Temporibus.', 'Blanditiis expedita.', 'Earum illo vitae in.', 'https://via.placeholder.com/640x480.png/005544?text=in', 0, '9545 Bednar Ports\nNew Jerodchester, SD 66298', '-48.966376', '134.506273', 'http://kemmer.biz/officiis-sapiente-sequi-voluptatibus-est-magnam-fugiat.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (12, 'Officiis et et.', 'Ut sint et corporis.', 'Possimus velit quia.', 'https://via.placeholder.com/640x480.png/00aa33?text=rem', 1, '4246 Herminia Curve\nWest Declan, AK 50159', '14.638128', '59.544389', 'https://www.lynch.com/ratione-sit-rem-dolor-pariatur-doloremque-aspernatur', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (13, 'Ad aut quia aut.', 'Impedit nulla animi.', 'Qui fugit saepe.', 'https://via.placeholder.com/640x480.png/0088ff?text=minima', 1, '1149 Melody Passage\nNew Gunner, DE 13685', '-28.182733', '-124.208437', 'http://dietrich.org/et-ipsam-aliquam-sint-sint', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (14, 'In quisquam ea.', 'Quasi hic quibusdam.', 'Aut sit optio.', 'https://via.placeholder.com/640x480.png/005599?text=officia', 1, '19929 Marietta Skyway Suite 106\nNew June, WA 66011', '-15.758135', '23.086491', 'https://witting.info/sed-nisi-expedita-doloremque-omnis-esse-minima.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (15, 'Magni dolorum.', 'Rerum qui sit.', 'Consequatur.', 'https://via.placeholder.com/640x480.png/007711?text=architecto', 1, '43326 Shayne Flat\nEast Valentinstad, NC 56142-1837', '29.737439', '-125.342381', 'http://www.abbott.com/impedit-quo-aut-quo-soluta-ut-sequi', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (16, 'Sed ut error.', 'Nihil reprehenderit.', 'Et culpa saepe.', 'https://via.placeholder.com/640x480.png/00dd55?text=occaecati', 1, '139 Lockman Ways\nPort Deonte, DE 57120-4782', '-12.544885', '-101.146365', 'http://www.nitzsche.com/mollitia-a-temporibus-ea-libero-recusandae', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (17, 'Fugiat consequatur.', 'Sit assumenda.', 'Aliquam natus atque.', 'https://via.placeholder.com/640x480.png/007733?text=natus', 0, '52494 Rutherford Flats Apt. 766\nHayesport, TX 12327', '-42.378704', '-81.381615', 'http://www.klocko.com/in-ut-sed-cumque-necessitatibus-deleniti-aut-dolor-et.html', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (18, 'Quia eaque voluptas.', 'Dicta eos dolorem.', 'Ratione repudiandae.', 'https://via.placeholder.com/640x480.png/001122?text=maiores', 1, '254 Adolphus Village\nErnabury, IN 36410', '81.302108', '72.164648', 'http://www.collier.com/', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (19, 'Et sit rerum id ut.', 'Sunt eos harum.', 'Quae pariatur quos.', 'https://via.placeholder.com/640x480.png/004444?text=reiciendis', 0, '3729 Koch Meadow Apt. 914\nNorth Deshaunville, AK 75994-2911', '6.298949', '-137.054195', 'http://homenick.com/qui-temporibus-officiis-a-magni-et-doloribus-explicabo.html', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (20, 'Vel eius vel magnam.', 'Adipisci ipsa quis.', 'Ut qui aut dolores.', 'https://via.placeholder.com/640x480.png/0033dd?text=ut', 0, '8173 Russel Station\nAltaland, IA 36133', '-89.273148', '57.778852', 'https://collier.com/eum-rem-laboriosam-aut.html', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (21, 'Quidem at sapiente.', 'Voluptatibus.', 'Dicta sint eius.', 'https://via.placeholder.com/640x480.png/001155?text=officiis', 0, '35338 Trey Hills\nWest Zechariah, CT 36624', '56.740215', '7.289833', 'http://kuphal.net/praesentium-omnis-rerum-et-sed', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (22, 'Ea perferendis.', 'Soluta illum quia.', 'Consequatur est aut.', 'https://via.placeholder.com/640x480.png/006622?text=quia', 0, '939 Brakus Shores Suite 825\nLake Furmanport, SD 59280', '33.48199', '-71.141887', 'http://www.simonis.net/quaerat-et-dolorem-odit-magnam', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (23, 'Expedita enim.', 'Sint quo eaque.', 'Facilis praesentium.', 'https://via.placeholder.com/640x480.png/008855?text=quo', 0, '559 Gilda Burgs\nWest Retha, NH 87106', '-32.302031', '92.089746', 'http://cormier.net/accusantium-odio-ut-temporibus-est.html', 3, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (24, 'Doloribus et dolore.', 'Aut et et quia.', 'Aut aut nam tenetur.', 'https://via.placeholder.com/640x480.png/0066ee?text=dolores', 0, '2884 Schumm Mall\nNorth Pasqualebury, DC 21288-8809', '-12.008107', '-175.984215', 'http://hegmann.biz/provident-eaque-cum-aperiam', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (25, 'Molestias maxime.', 'Voluptate tempora.', 'Tempora est.', 'https://via.placeholder.com/640x480.png/0011bb?text=pariatur', 1, '155 Leopold Ways Apt. 848\nPort Princessmouth, IA 71458', '-29.738178', '80.108585', 'http://www.blick.com/molestias-aliquid-deserunt-dolores-ab-minus-recusandae.html', 3, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (26, 'Est natus est autem.', 'Consequatur est.', 'Ipsa iste harum.', 'https://via.placeholder.com/640x480.png/003322?text=aut', 1, '978 Kieran Trail\nCaleighburgh, NV 72698', '67.884738', '-30.353791', 'http://www.krajcik.com/', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (27, 'Molestiae minus.', 'Quis excepturi enim.', 'Dolorem est qui.', 'https://via.placeholder.com/640x480.png/004444?text=repellat', 1, '79533 Merle Drive\nProhaskastad, SC 51444-2354', '87.824639', '80.804497', 'http://www.lemke.com/assumenda-molestias-in-dicta-molestias-aliquid-nisi', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (28, 'Consequatur est.', 'Fuga animi dolor.', 'Quasi aut non id.', 'https://via.placeholder.com/640x480.png/0099ee?text=quia', 1, '658 Christiana Court Apt. 492\nWest Destanyland, AL 08894', '-47.459442', '-1.480547', 'http://heathcote.org/itaque-aut-commodi-nemo-voluptatibus', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (29, 'Deserunt nostrum.', 'Impedit alias culpa.', 'Reprehenderit et.', 'https://via.placeholder.com/640x480.png/004422?text=aut', 1, '690 Nannie Ramp\nRandiville, MI 63515', '-7.602674', '136.642862', 'http://www.bartell.com/ex-ad-quo-eum-perspiciatis-consectetur-est', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (30, 'Sed soluta rerum.', 'Sed tenetur a autem.', 'Provident excepturi.', 'https://via.placeholder.com/640x480.png/00ff11?text=molestiae', 1, '6903 Gayle Land Suite 071\nSatterfieldmouth, SC 75069', '-4.162658', '128.773292', 'http://douglas.biz/', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (31, 'Et quia unde quis.', 'Non veritatis.', 'Molestias incidunt.', 'https://via.placeholder.com/640x480.png/00eeff?text=eos', 0, '9057 Electa Springs Suite 878\nViviannestad, UT 35898-3111', '-32.001734', '44.91334', 'http://www.beahan.com/in-maiores-eveniet-quidem-consectetur-nobis-occaecati-non-exercitationem.html', 3, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (32, 'Quasi temporibus id.', 'Deleniti provident.', 'Rerum expedita sed.', 'https://via.placeholder.com/640x480.png/00cc55?text=laborum', 0, '55087 Mertz Rapid\nBergechester, WY 85020', '-78.759404', '175.460126', 'http://www.beahan.com/', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (33, 'Eum fuga esse omnis.', 'Enim nihil.', 'Enim earum incidunt.', 'https://via.placeholder.com/640x480.png/00eecc?text=dolores', 0, '6748 Lewis Unions Apt. 293\nMurphyfurt, WA 28391', '-47.130665', '-178.366083', 'http://douglas.org/omnis-voluptatem-provident-molestiae-modi-architecto', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (34, 'Itaque vitae sunt.', 'Est consequatur.', 'Explicabo molestias.', 'https://via.placeholder.com/640x480.png/0011ff?text=accusamus', 1, '582 Euna Course Suite 130\nSophiahaven, CT 42757', '71.016646', '36.622987', 'http://aufderhar.com/pariatur-eligendi-dolorum-quis-nam-eveniet-velit', 3, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (35, 'Quam recusandae qui.', 'Sunt et eius amet.', 'Qui voluptatem sint.', 'https://via.placeholder.com/640x480.png/008800?text=nihil', 0, '7871 Hoeger Center Suite 260\nSouth Aurelieshire, OK 56066-8405', '20.55421', '-103.04973', 'http://www.grant.info/et-hic-officiis-odit-et-eos.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (36, 'Sint rem eligendi.', 'Quo architecto eius.', 'Fugiat nesciunt.', 'https://via.placeholder.com/640x480.png/007777?text=at', 1, '61936 Bessie Locks Suite 918\nStephaniemouth, VT 49051', '57.878157', '44.096212', 'https://oconnell.com/fuga-distinctio-sequi-aut-temporibus-quia.html', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (37, 'Qui a at minus quae.', 'Et est provident.', 'Autem quisquam.', 'https://via.placeholder.com/640x480.png/003388?text=expedita', 0, '2657 Ottilie Field Suite 153\nWeimannbury, MT 30585-8550', '-39.288823', '121.391167', 'https://mertz.info/incidunt-laborum-nihil-natus-et-sint-quia-aliquam-eum.html', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (38, 'Ut molestiae quasi.', 'Numquam qui iure.', 'Et ut quod ut qui.', 'https://via.placeholder.com/640x480.png/00bb22?text=temporibus', 1, '3994 Bosco Wall\nKeeblerport, OK 12379', '39.273513', '-7.961926', 'http://bergstrom.com/dolores-consequuntur-fugiat-laudantium.html', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (39, 'Labore reiciendis.', 'Doloribus placeat.', 'Sequi minima sit.', 'https://via.placeholder.com/640x480.png/007733?text=harum', 1, '321 Wintheiser View\nSchowalterfort, MD 36665', '35.903732', '163.037914', 'http://gibson.com/', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (40, 'Eius adipisci.', 'Consequatur id quo.', 'Et non modi aliquid.', 'https://via.placeholder.com/640x480.png/00aaaa?text=corporis', 1, '205 Quitzon Wall Apt. 034\nGriffinbury, VA 84083', '40.203935', '14.305033', 'http://www.boyer.biz/', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (41, 'Ab consequatur.', 'Voluptas.', 'Quos autem sequi.', 'https://via.placeholder.com/640x480.png/00eebb?text=dolor', 1, '306 Toni Falls Apt. 152\nPort Trystanside, NH 06464', '-43.321125', '98.276804', 'https://skiles.com/molestias-aut-officiis-minima-quo-deleniti-pariatur-vero.html', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (42, 'Minus rerum.', 'Doloremque dolores.', 'Molestias.', 'https://via.placeholder.com/640x480.png/0022ee?text=eum', 1, '468 Cronin Overpass Suite 881\nWinifredbury, HI 68190', '-9.436341', '113.747346', 'https://www.oreilly.org/aut-odit-beatae-possimus-omnis', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (43, 'Aut magnam est quo.', 'Qui excepturi est.', 'Perspiciatis qui.', 'https://via.placeholder.com/640x480.png/007766?text=libero', 0, '24192 Cynthia Rapids Suite 408\nLake Nicklaus, ND 54971-3604', '85.958996', '-156.986826', 'https://rodriguez.com/ut-et-voluptas-autem-ut-quasi-ullam.html', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (44, 'Ea non debitis.', 'Aut quos nisi ea.', 'Tenetur id.', 'https://via.placeholder.com/640x480.png/009933?text=laborum', 0, '4136 Collier Circle Apt. 041\nGutkowskiport, VA 52730-9355', '-7.045882', '13.087947', 'http://mraz.com/sit-deserunt-asperiores-libero-repudiandae-amet-quasi.html', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (45, 'Dolor aspernatur.', 'Perferendis debitis.', 'Sit natus vel aut.', 'https://via.placeholder.com/640x480.png/009955?text=debitis', 1, '65613 Cruickshank Squares Apt. 150\nSouth Ima, HI 88461-9931', '17.185662', '151.262871', 'http://www.runolfsson.com/rerum-cumque-quas-at-nostrum-possimus-eius-mollitia', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (46, 'Repudiandae qui.', 'Inventore eaque et.', 'Est odio.', 'https://via.placeholder.com/640x480.png/00dddd?text=officiis', 0, '9590 Shyann Extensions Apt. 334\nLake Cedrickland, ID 74967', '-84.034986', '-24.345389', 'http://paucek.com/harum-praesentium-quia-consequatur', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (47, 'Quos exercitationem.', 'Magnam eveniet amet.', 'Adipisci voluptas.', 'https://via.placeholder.com/640x480.png/00aa66?text=voluptatem', 0, '8307 Cummerata Drives\nLake Ikehaven, IN 35439', '30.059122', '109.099289', 'http://shields.net/', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (48, 'Aspernatur qui.', 'Id at voluptatem.', 'Quo aut corrupti.', 'https://via.placeholder.com/640x480.png/00bbff?text=impedit', 0, '54580 Major Manors\nNorth Baylee, PA 51506-4535', '-26.311737', '-126.562007', 'http://www.leuschke.org/suscipit-error-ut-dolore-vero-consequatur-doloremque-deleniti', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (49, 'Est unde ex id.', 'Unde dolores.', 'Voluptas quo enim.', 'https://via.placeholder.com/640x480.png/00bb00?text=optio', 0, '4682 Eichmann Drive Suite 142\nNorth Jacey, OK 53016-6233', '77.562004', '-119.685177', 'http://dach.net/qui-quisquam-necessitatibus-qui.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (50, 'Vel aut ullam.', 'Quia omnis eligendi.', 'Temporibus.', 'https://via.placeholder.com/640x480.png/00eeee?text=suscipit', 1, '236 Heathcote Summit\nLake Darrin, MN 19074', '78.234083', '94.398052', 'http://schamberger.com/voluptas-sint-nulla-et-quae-aut-totam-quo-ea.html', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (51, 'Quo sed qui aut.', 'Earum rem assumenda.', 'Soluta ipsa omnis.', 'https://via.placeholder.com/640x480.png/0077aa?text=suscipit', 0, '972 Hintz Shore\nNew Arnulfoborough, RI 55506', '74.614793', '11.069873', 'http://conroy.org/molestiae-ducimus-nobis-omnis-deserunt-placeat-voluptatem-sint', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (52, 'Occaecati iste aut.', 'Sit enim doloribus.', 'Tempore et.', 'https://via.placeholder.com/640x480.png/004477?text=quam', 1, '4675 Green Fords Suite 944\nEast Camryn, MA 05630', '-48.44455', '154.348199', 'https://trantow.info/sapiente-nihil-modi-laudantium-non-illum-eius.html', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (53, 'Et accusantium.', 'Explicabo illum.', 'Sit vel autem sunt.', 'https://via.placeholder.com/640x480.png/000044?text=quidem', 0, '418 Maggie Isle Apt. 675\nLupeview, NC 10098-3496', '-42.127818', '-144.491723', 'http://www.stracke.biz/', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (54, 'Eveniet culpa quas.', 'Velit.', 'Esse qui alias.', 'https://via.placeholder.com/640x480.png/0099ee?text=quia', 0, '820 Lucy Road Suite 892\nLake Katelynnfort, IA 71366-5353', '-69.236637', '131.866718', 'http://www.parisian.com/', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (55, 'Dicta ea.', 'Omnis officiis.', 'Dolorem nostrum.', 'https://via.placeholder.com/640x480.png/00aa88?text=minima', 0, '34613 Jewell Fields Suite 770\nPort Kathleenchester, NE 92799', '54.127922', '-163.963357', 'http://doyle.com/illum-minus-error-quasi-aut-suscipit-dicta', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (56, 'Beatae et deleniti.', 'Sed expedita culpa.', 'Aspernatur ab.', 'https://via.placeholder.com/640x480.png/007755?text=autem', 1, '79834 Fern Garden Apt. 815\nWallacefurt, MA 72700-5584', '61.844885', '-156.376098', 'http://www.blick.com/provident-eos-quia-in-quia', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (57, 'Voluptas delectus.', 'Totam quae ut.', 'Aut eveniet veniam.', 'https://via.placeholder.com/640x480.png/000088?text=reiciendis', 0, '1640 Tromp Skyway Apt. 763\nWaelchiview, GA 03301', '32.512328', '51.591012', 'http://www.wyman.com/hic-velit-ipsa-sapiente-et-suscipit-esse-ut', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (58, 'Deserunt est quod.', 'Eos nihil et.', 'Est est eaque qui.', 'https://via.placeholder.com/640x480.png/006666?text=ut', 0, '296 Huels Glen\nPfeffermouth, ME 38545', '11.558837', '-18.330406', 'http://www.barrows.com/qui-voluptate-inventore-tempore-officiis-ut', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (59, 'Ea enim omnis.', 'Reprehenderit in.', 'Aut explicabo.', 'https://via.placeholder.com/640x480.png/00aa55?text=quaerat', 0, '532 Annetta Plains Apt. 966\nQuincyport, OK 01407-5057', '80.031028', '51.529412', 'http://www.stehr.com/', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (60, 'Quia sunt quos ut.', 'At veniam veniam.', 'Voluptas qui.', 'https://via.placeholder.com/640x480.png/009900?text=quo', 0, '991 Hermiston Place Suite 884\nChristophefort, ND 74183', '-9.924411', '-37.894465', 'https://cole.info/voluptatem-deserunt-voluptatibus-et-sit-nemo.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (61, 'Porro a eos dolor.', 'Quas harum.', 'Aperiam dolores.', 'https://via.placeholder.com/640x480.png/006699?text=quam', 1, '416 Wanda Neck Apt. 533\nEast Wilfredmouth, NC 33609-5194', '73.474609', '-130.572318', 'http://torphy.com/et-cumque-iusto-et-unde', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (62, 'Aut sed enim quia.', 'Doloremque aut eum.', 'Reprehenderit.', 'https://via.placeholder.com/640x480.png/0022ee?text=consequatur', 0, '421 Pfannerstill Drives\nSouth Richieshire, IL 47618-7550', '-71.822795', '-86.704991', 'http://www.nolan.com/laudantium-nostrum-qui-accusantium-et-blanditiis-et-est-beatae.html', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (63, 'Omnis autem non.', 'Dolore expedita et.', 'Dolorem eaque et.', 'https://via.placeholder.com/640x480.png/0077aa?text=beatae', 0, '6664 Liam Ferry\nOsinskifort, HI 08337-7717', '-74.669981', '132.754419', 'http://www.cartwright.net/iste-rerum-inventore-quia-ad-et', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (64, 'Qui nemo numquam ut.', 'Doloremque esse.', 'Laboriosam autem.', 'https://via.placeholder.com/640x480.png/00eedd?text=quod', 1, '341 Tromp Lock Apt. 091\nJeramyville, KY 27166-4679', '-56.34374', '49.702989', 'http://konopelski.com/autem-et-quisquam-eaque-sint-est-vel-officia', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (65, 'Eligendi ducimus.', 'Excepturi aperiam.', 'Accusantium qui in.', 'https://via.placeholder.com/640x480.png/00cc55?text=consequatur', 1, '70399 Jordyn Glens\nNew Christopher, NE 46896', '73.914216', '-68.283034', 'http://thompson.net/est-alias-aperiam-quasi-est-aperiam-accusantium-et.html', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (66, 'Quaerat nobis est.', 'Est consequatur.', 'Ea odit et nemo.', 'https://via.placeholder.com/640x480.png/0022aa?text=asperiores', 0, '44450 Ankunding Lake\nEast Jaycefurt, HI 35362-2772', '60.575826', '-171.501413', 'http://bernier.com/dicta-error-autem-fugiat-asperiores', 3, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (67, 'Ut a non provident.', 'Natus dolorum.', 'Alias est veritatis.', 'https://via.placeholder.com/640x480.png/003399?text=aut', 0, '53222 Moore Curve Apt. 203\nSouth Ralph, CT 87079-4918', '7.082862', '134.291407', 'http://www.schuppe.com/alias-veniam-numquam-ut-ipsam-dolorum-voluptatem', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (68, 'Ipsum accusamus.', 'Ducimus ut.', 'Sit eum aperiam.', 'https://via.placeholder.com/640x480.png/0022bb?text=et', 0, '7899 Kertzmann Way Apt. 813\nNorth Sylvan, UT 56587', '87.30101', '55.365856', 'https://rempel.com/corporis-quod-eligendi-fugit-harum.html', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (69, 'Placeat sed cumque.', 'Est quidem rerum.', 'Inventore minima.', 'https://via.placeholder.com/640x480.png/003344?text=dolorum', 1, '27639 Jovanny Ports Apt. 102\nTurcottefort, FL 17579', '-54.541696', '-1.781668', 'http://www.klocko.com/quaerat-dolorem-omnis-et-libero-sapiente-consequatur-neque-in', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (70, 'Expedita aliquam ex.', 'Consequuntur eos ea.', 'Aut autem placeat.', 'https://via.placeholder.com/640x480.png/00cccc?text=enim', 1, '289 Auer Road Suite 423\nNorth Janessaland, MD 03942', '-67.893901', '-65.05573', 'http://wolff.com/nihil-nihil-id-sed-et-unde-dolorum', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (71, 'Ad distinctio.', 'Totam est ea ut.', 'Laboriosam ut.', 'https://via.placeholder.com/640x480.png/0099ee?text=numquam', 1, '268 Rice Fall\nKrisview, WY 26158-2297', '25.058861', '-41.780363', 'http://www.schmitt.biz/sint-tenetur-quis-sint-blanditiis-eveniet-aut-sit.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (72, 'Quia expedita alias.', 'Accusantium quia.', 'Dignissimos qui.', 'https://via.placeholder.com/640x480.png/005544?text=recusandae', 1, '57564 Bell Circles\nPort Hollie, UT 50814', '-70.975925', '-44.222842', 'http://crist.com/aspernatur-consequatur-expedita-dignissimos-dignissimos-accusamus', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (73, 'Omnis qui voluptas.', 'Laborum qui facere.', 'Et impedit at.', 'https://via.placeholder.com/640x480.png/005544?text=voluptatem', 1, '910 Ahmad Brooks Apt. 541\nAbshirehaven, NY 95426', '81.397247', '-1.686309', 'http://upton.net/iusto-quo-quia-dolores-voluptate-sint', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (74, 'Blanditiis corrupti.', 'Molestiae nesciunt.', 'Id numquam.', 'https://via.placeholder.com/640x480.png/00bbbb?text=voluptas', 0, '39037 Dicki Shore\nNorth Arimouth, NM 22192', '-59.1004', '178.379073', 'https://www.miller.com/perferendis-rerum-in-a-ratione', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (75, 'Nihil suscipit.', 'Id explicabo natus.', 'Numquam facilis non.', 'https://via.placeholder.com/640x480.png/009966?text=magnam', 0, '517 Eichmann Street Apt. 378\nNorth Leif, SD 79199', '9.827129', '-58.119661', 'http://www.king.com/magni-excepturi-voluptate-inventore-quia.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (76, 'Voluptatum qui non.', 'Voluptatem ea.', 'In explicabo eos.', 'https://via.placeholder.com/640x480.png/00dd99?text=rem', 0, '5806 Abraham Views\nRicofurt, MD 19763-8006', '-1.2437', '76.790404', 'http://monahan.com/est-voluptas-quam-rerum-iure-est-possimus-sed', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (77, 'Explicabo qui.', 'Doloremque amet.', 'Inventore sint quod.', 'https://via.placeholder.com/640x480.png/00ee66?text=voluptatem', 1, '13381 Wilkinson Summit\nMuellerland, DE 40664', '-38.176642', '50.919776', 'http://www.feest.com/dolore-reprehenderit-aperiam-eveniet-a-hic-deserunt-fuga', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (78, 'Ratione qui dolor.', 'Sint nemo ut non.', 'Sint reiciendis.', 'https://via.placeholder.com/640x480.png/00cc66?text=nulla', 1, '662 Shana Views Apt. 815\nNorth Hester, IN 91712-5344', '18.716841', '16.142955', 'https://mohr.com/qui-cupiditate-quo-doloribus-consectetur-et.html', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (79, 'Quo voluptate porro.', 'Minus sit rerum.', 'Illo illum sed.', 'https://via.placeholder.com/640x480.png/002244?text=dolorum', 0, '64793 Reina Spur\nJacobsonview, RI 78450', '-18.679759', '-63.035136', 'http://www.fisher.biz/id-eum-vel-fuga-qui-at-quia-quis-impedit.html', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (80, 'Est et voluptas.', 'Voluptatem vel qui.', 'Aut aliquam beatae.', 'https://via.placeholder.com/640x480.png/00eeff?text=veritatis', 1, '78716 Goodwin Brook Suite 346\nNew Abbieport, OH 07685-7841', '69.63017', '66.228444', 'https://johnston.com/ipsa-molestiae-enim-magni-corrupti-vero-aut.html', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (81, 'Qui libero pariatur.', 'Aut voluptatibus.', 'Corrupti nihil.', 'https://via.placeholder.com/640x480.png/005500?text=nihil', 0, '8268 Torphy Isle Suite 168\nNew Olen, ND 50362-4339', '-48.661055', '-33.655164', 'http://www.koepp.biz/vel-quaerat-possimus-provident-quia.html', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (82, 'Voluptatem error.', 'Vitae nostrum.', 'Quia et ut quisquam.', 'https://via.placeholder.com/640x480.png/006688?text=totam', 0, '8827 Celia Terrace Apt. 897\nMurrayshire, OK 81197', '27.73135', '-12.664804', 'http://www.raynor.biz/', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (83, 'Aspernatur ducimus.', 'Rerum voluptates et.', 'Commodi dolorum.', 'https://via.placeholder.com/640x480.png/002233?text=officiis', 1, '588 Okey Port\nEstherburgh, IA 82576-2758', '-76.944419', '23.334767', 'http://bosco.com/et-ut-recusandae-officiis-et-voluptatem-voluptas', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (84, 'Culpa sunt eos.', 'Recusandae qui.', 'Vitae a vero dolore.', 'https://via.placeholder.com/640x480.png/00cc55?text=temporibus', 0, '83495 Shields Parkway\nWest Shannon, WI 52174', '60.56952', '-121.050452', 'http://www.berge.com/sed-aut-maxime-sunt-ratione-amet', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (85, 'Numquam et cum.', 'Inventore.', 'In et officia est.', 'https://via.placeholder.com/640x480.png/003333?text=iure', 1, '6290 Alisha Camp Suite 090\nBarrowsfurt, TN 06724', '-67.365579', '28.023096', 'http://www.goodwin.com/eius-atque-dolorem-earum-impedit', 4, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (86, 'Nam recusandae.', 'Cum possimus a odio.', 'Iste sit numquam.', 'https://via.placeholder.com/640x480.png/0011cc?text=voluptatum', 0, '340 Upton Ridge Apt. 439\nLuzburgh, UT 36018-5606', '-26.474656', '-100.466404', 'https://www.zulauf.com/eos-exercitationem-optio-rerum-quidem', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (87, 'Et quod aliquid.', 'Necessitatibus.', 'Ut modi tenetur.', 'https://via.placeholder.com/640x480.png/000022?text=unde', 1, '934 Jacinto Bridge\nRusselbury, DE 68167-4895', '88.625505', '-95.124653', 'https://www.nicolas.net/et-minus-iusto-voluptas-temporibus-distinctio-veritatis-delectus', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (88, 'Numquam pariatur.', 'Assumenda omnis in.', 'Sint enim id vel.', 'https://via.placeholder.com/640x480.png/00bb99?text=earum', 0, '4302 Grimes Vista\nMaggiofurt, ND 46705-4872', '36.443931', '87.608985', 'http://boyle.com/quod-voluptatibus-perspiciatis-deleniti-aliquid-illo', 10, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (89, 'Quia fugiat sit quo.', 'Inventore iusto.', 'Aperiam rerum ipsam.', 'https://via.placeholder.com/640x480.png/0077ff?text=consequatur', 0, '280 Mauricio Shoal Apt. 025\nGarnetmouth, NY 38571', '-7.524687', '-99.372641', 'http://www.lindgren.net/aperiam-incidunt-earum-optio', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (90, 'Sapiente.', 'Et quis eum est.', 'Non ab eius nihil.', 'https://via.placeholder.com/640x480.png/0066ff?text=libero', 1, '46075 Edmond Throughway\nMinnieland, NM 62047', '70.684074', '-64.652127', 'http://www.wisozk.com/soluta-natus-quo-itaque.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (91, 'Ea laboriosam fugit.', 'Iusto ab fugiat.', 'Et perferendis.', 'https://via.placeholder.com/640x480.png/008888?text=voluptas', 1, '5773 Bayer Neck\nNorth Wilbertstad, UT 38342', '50.182804', '98.662796', 'http://www.bruen.com/unde-dolores-ut-delectus-ea-saepe-est', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (92, 'Sunt ut sapiente.', 'Pariatur qui ut.', 'Ut cumque et rem.', 'https://via.placeholder.com/640x480.png/00ee44?text=optio', 1, '580 Dietrich Harbors\nFavianfort, FL 22422', '17.442854', '-41.541042', 'http://www.wyman.com/voluptatem-pariatur-nostrum-distinctio-necessitatibus-tempore-magnam-molestiae', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (93, 'Aut tempora autem.', 'Consequuntur.', 'Aut voluptas nihil.', 'https://via.placeholder.com/640x480.png/00aadd?text=animi', 1, '7183 Bonita Passage Apt. 071\nModestoberg, SC 61176-6107', '-38.828157', '-119.422624', 'https://smith.com/alias-suscipit-sapiente-et.html', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (94, 'Quaerat deserunt.', 'Modi at rerum.', 'Ipsum ut aut quia.', 'https://via.placeholder.com/640x480.png/000044?text=delectus', 0, '792 Borer Key Apt. 433\nNorth Verdatown, NE 37537', '87.002657', '-163.339461', 'http://pacocha.com/', 2, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (95, 'Architecto ut vel.', 'Placeat sint.', 'Fugit labore autem.', 'https://via.placeholder.com/640x480.png/00cccc?text=voluptatibus', 1, '596 Gleason Square Apt. 922\nFlostad, CO 65112-0421', '53.471431', '172.138572', 'http://fahey.com/', 9, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (96, 'Quaerat error quos.', 'Debitis velit.', 'Ad nihil dolores.', 'https://via.placeholder.com/640x480.png/00dd44?text=vel', 0, '271 Charlene Throughway Apt. 467\nSouth Marques, CO 53472', '-36.143705', '48.507143', 'http://gutmann.org/nam-ducimus-nemo-id', 5, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (97, 'Voluptatem mollitia.', 'Eum eum molestiae.', 'Autem illum.', 'https://via.placeholder.com/640x480.png/005533?text=nobis', 0, '263 Marlon Pine\nAbshirechester, NH 29343-4524', '-7.912481', '59.926869', 'http://cassin.net/', 6, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (98, 'Tempora ut natus.', 'Modi labore sit sed.', 'Vero deserunt.', 'https://via.placeholder.com/640x480.png/00bbbb?text=vitae', 1, '5530 Orn Vista Suite 735\nNehaville, CA 48104', '13.263715', '-46.779181', 'http://www.swift.com/possimus-itaque-veritatis-et-excepturi-similique-omnis', 7, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (99, 'Dolores blanditiis.', 'Est in enim tempora.', 'Iure sit commodi.', 'https://via.placeholder.com/640x480.png/00ee99?text=omnis', 1, '652 Neha Streets\nParkerport, DE 04403', '-78.370941', '-118.346253', 'https://satterfield.com/odit-a-autem-dolores-nesciunt-laudantium-voluptas-est.html', 1, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);
INSERT INTO `ministries` VALUES (100, 'Earum voluptatem.', 'Voluptatem tempora.', 'Ratione et magni id.', 'https://via.placeholder.com/640x480.png/00dd99?text=nemo', 1, '61585 Dorothy View Suite 199\nMalikashire, FL 68731', '-49.181789', '69.122377', 'http://rowe.com/commodi-cumque-vitae-architecto-numquam-occaecati', 8, '2022-08-31 13:20:41', '2022-08-31 13:20:41', NULL);

-- ----------------------------
-- Table structure for partners
-- ----------------------------
DROP TABLE IF EXISTS `partners`;
CREATE TABLE `partners`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `location` int(0) NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for password_resets
-- ----------------------------
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets`  (
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  INDEX `password_resets_email_index`(`email`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for personal_access_tokens
-- ----------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint(0) UNSIGNED NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `last_used_at` timestamp(0) NULL DEFAULT NULL,
  `expires_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `personal_access_tokens_token_unique`(`token`) USING BTREE,
  INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for proc
-- ----------------------------
DROP TABLE IF EXISTS `proc`;
CREATE TABLE `proc`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `descr_en` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_ar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_kr` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `enabled` int(0) NOT NULL,
  `directorate_id` int(0) NULL DEFAULT NULL,
  `shortname` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `publish_date` date NULL DEFAULT NULL,
  `last_update` timestamp(0) NOT NULL,
  `last_update_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for proc_items
-- ----------------------------
DROP TABLE IF EXISTS `proc_items`;
CREATE TABLE `proc_items`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `proc_id` int(0) NOT NULL,
  `title_en` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `descr_en` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_ar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_kr` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `enabled` tinyint(0) NOT NULL,
  `url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `publish_date` timestamp(0) NULL DEFAULT NULL,
  `last_update` timestamp(0) NOT NULL,
  `last_update_by` int(0) NOT NULL,
  `created_by` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for proc_tags
-- ----------------------------
DROP TABLE IF EXISTS `proc_tags`;
CREATE TABLE `proc_tags`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `proc_id` int(0) NOT NULL,
  `tag_val` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `review` int(0) NOT NULL,
  `review_msg` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dest_type` int(0) NOT NULL COMMENT '0: Proc, 1: Proc Item, 2: Directorate, 3: Ministry',
  `dest_id` int(0) NOT NULL,
  `token` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `strkey` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `strval_en` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `strval_ar` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `strval_kr` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` int(0) NOT NULL,
  `title` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_trans` tinyint(0) NOT NULL COMMENT 'No translation required like: phone and email',
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for slider
-- ----------------------------
DROP TABLE IF EXISTS `slider`;
CREATE TABLE `slider`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_en` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_ar` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descr_kr` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `img` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `enabled` tinyint(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_en` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_kr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumb_img` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `img` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `v_order` int(0) NOT NULL COMMENT 'vertical order',
  `job_title_en` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `job_title_ar` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `job_title_kr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio_en` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio_ar` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio_kr` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `location` tinyint(0) NOT NULL,
  `enabled` tinyint(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp(0) NULL DEFAULT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` int(0) NOT NULL COMMENT '0: End users, 1: Moderators, 2: Admins',
  `profile_pic` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login_ip` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `salt` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fb_token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fb_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `google_token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` int(0) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `users_email_unique`(`email`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
