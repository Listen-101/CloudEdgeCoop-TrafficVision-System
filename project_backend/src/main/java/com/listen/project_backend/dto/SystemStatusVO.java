package com.listen.project_backend.dto;

public class SystemStatusVO {
    private double cpuUsage;
    private double memoryUsage;
    private double diskUsage;
    private long jvmTotalMemory;
    private long jvmFreeMemory;
    private long jvmUsedMemory;
    private int activeDevices;
    private long uptimeSeconds;
    private int processingQueueSize;

    public double getCpuUsage() { return cpuUsage; }
    public void setCpuUsage(double cpuUsage) { this.cpuUsage = cpuUsage; }

    public double getMemoryUsage() { return memoryUsage; }
    public void setMemoryUsage(double memoryUsage) { this.memoryUsage = memoryUsage; }

    public double getDiskUsage() { return diskUsage; }
    public void setDiskUsage(double diskUsage) { this.diskUsage = diskUsage; }

    public long getJvmTotalMemory() { return jvmTotalMemory; }
    public void setJvmTotalMemory(long jvmTotalMemory) { this.jvmTotalMemory = jvmTotalMemory; }

    public long getJvmFreeMemory() { return jvmFreeMemory; }
    public void setJvmFreeMemory(long jvmFreeMemory) { this.jvmFreeMemory = jvmFreeMemory; }

    public long getJvmUsedMemory() { return jvmUsedMemory; }
    public void setJvmUsedMemory(long jvmUsedMemory) { this.jvmUsedMemory = jvmUsedMemory; }

    public int getActiveDevices() { return activeDevices; }
    public void setActiveDevices(int activeDevices) { this.activeDevices = activeDevices; }

    public long getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }

    public int getProcessingQueueSize() { return processingQueueSize; }
    public void setProcessingQueueSize(int processingQueueSize) { this.processingQueueSize = processingQueueSize; }
}
