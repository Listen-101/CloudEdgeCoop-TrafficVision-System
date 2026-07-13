-- schoolProjectDB 初始化脚本

CREATE DATABASE IF NOT EXISTS schoolProjectDB
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE schoolProjectDB;

-- 设备表
CREATE TABLE IF NOT EXISTS device (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL UNIQUE COMMENT '设备唯一标识',
    name VARCHAR(128) DEFAULT '' COMMENT '设备名称',
    status VARCHAR(16) DEFAULT 'OFFLINE' COMMENT '状态: ONLINE/OFFLINE',
    last_heartbeat DATETIME COMMENT '最后心跳时间',
    server_host VARCHAR(128) DEFAULT '' COMMENT '服务器地址',
    server_port INT DEFAULT 8080 COMMENT '服务器端口',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- 帧记录表
CREATE TABLE IF NOT EXISTS frame_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL COMMENT '设备ID',
    file_name VARCHAR(256) DEFAULT '' COMMENT '文件名',
    file_path VARCHAR(512) DEFAULT '' COMMENT '文件存储路径',
    file_size BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
    timestamp DATETIME COMMENT '采集时间戳',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帧记录表';

-- 识别结果表
CREATE TABLE IF NOT EXISTS recognition_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    frame_id BIGINT COMMENT '关联帧ID',
    device_id VARCHAR(64) NOT NULL COMMENT '设备ID',
    plate_number VARCHAR(32) DEFAULT '' COMMENT '车牌号',
    vehicle_type VARCHAR(32) DEFAULT '' COMMENT '车辆类型',
    alert_type VARCHAR(32) DEFAULT '' COMMENT '告警类型',
    confidence DOUBLE DEFAULT 0 COMMENT '置信度',
    result_data TEXT COMMENT '完整结果JSON',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_frame_id (frame_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='识别结果表';

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(32) NOT NULL COMMENT '日志类型: API/ERROR/DEVICE/IMAGE',
    content TEXT COMMENT '日志内容',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统日志表';
