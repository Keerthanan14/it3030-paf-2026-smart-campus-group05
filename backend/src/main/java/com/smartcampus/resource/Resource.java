package com.smartcampus.resource;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(length = 20)
    private String building;

    @Column
    private Integer floor;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(name = "chair_count")
    private Integer chairCount;

    @Column(name = "table_count")
    private Integer tableCount;

    @Column(name = "pc_count")
    private Integer pcCount;

    @Column(name = "equipment_count")
    private Integer equipmentCount;

    @Column(name = "has_ac")
    private Boolean hasAc;

    @Column(name = "has_fan")
    private Boolean hasFan;

    @Column(name = "has_projector")
    private Boolean hasProjector;

    @Column(name = "has_smartboard")
    private Boolean hasSmartboard;

    @Column(name = "has_camera")
    private Boolean hasCamera;

    @Column(name = "has_podium_with_pc")
    private Boolean hasPodiumWithPc;

    @Column(name = "has_podium")
    private Boolean hasPodium;

    @Column(name = "has_whiteboard")
    private Boolean hasWhiteboard;

    @Column(name = "has_clock")
    private Boolean hasClock;

    @Column(name = "has_lecture_chairs")
    private Boolean hasLectureChairs;

    @Column(name = "has_lecture_desks")
    private Boolean hasLectureDesks;

    @Column(name = "has_speakers")
    private Boolean hasSpeakers;

    @Column(name = "has_wifi")
    private Boolean hasWifi;

    @Column(name = "has_power_outlets")
    private Boolean hasPowerOutlets;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "availability_windows", columnDefinition = "jsonb")
    private Map<String, AvailabilityWindow> availabilityWindows;

    @Column(name = "allow_bookings")
    private Boolean allowBookings;

    @Column(name = "allow_requests")
    private Boolean allowRequests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResourceStatus status;

    @Column(nullable = false)
    private boolean deleted;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = ResourceStatus.ACTIVE;
        }
        if (building == null) {
            building = "MAIN";
        }
        if (floor == null) {
            floor = 1;
        }
        if (chairCount == null) {
            chairCount = 0;
        }
        if (tableCount == null) {
            tableCount = 0;
        }
        if (pcCount == null) {
            pcCount = 0;
        }
        if (equipmentCount == null) {
            equipmentCount = 0;
        }
        if (hasAc == null) {
            hasAc = false;
        }
        if (hasFan == null) {
            hasFan = false;
        }
        if (hasProjector == null) {
            hasProjector = false;
        }
        if (hasSmartboard == null) {
            hasSmartboard = false;
        }
        if (hasCamera == null) {
            hasCamera = false;
        }
        if (hasPodiumWithPc == null) {
            hasPodiumWithPc = false;
        }
        if (hasPodium == null) {
            hasPodium = false;
        }
        if (hasWhiteboard == null) {
            hasWhiteboard = false;
        }
        if (hasClock == null) {
            hasClock = false;
        }
        if (hasLectureChairs == null) {
            hasLectureChairs = false;
        }
        if (hasLectureDesks == null) {
            hasLectureDesks = false;
        }
        if (hasSpeakers == null) {
            hasSpeakers = false;
        }
        if (hasWifi == null) {
            hasWifi = false;
        }
        if (hasPowerOutlets == null) {
            hasPowerOutlets = false;
        }
        if (allowBookings == null) {
            allowBookings = true;
        }
        if (allowRequests == null) {
            allowRequests = true;
        }
        deleted = false;
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ResourceType getType() {
        return type;
    }

    public void setType(ResourceType type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public Integer getChairCount() {
        return chairCount;
    }

    public void setChairCount(Integer chairCount) {
        this.chairCount = chairCount;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public Integer getPcCount() {
        return pcCount;
    }

    public void setPcCount(Integer pcCount) {
        this.pcCount = pcCount;
    }

    public Integer getEquipmentCount() {
        return equipmentCount;
    }

    public void setEquipmentCount(Integer equipmentCount) {
        this.equipmentCount = equipmentCount;
    }

    public Boolean getHasAc() {
        return hasAc;
    }

    public void setHasAc(Boolean hasAc) {
        this.hasAc = hasAc;
    }

    public Boolean getHasFan() {
        return hasFan;
    }

    public void setHasFan(Boolean hasFan) {
        this.hasFan = hasFan;
    }

    public Boolean getHasProjector() {
        return hasProjector;
    }

    public void setHasProjector(Boolean hasProjector) {
        this.hasProjector = hasProjector;
    }

    public Boolean getHasSmartboard() {
        return hasSmartboard;
    }

    public void setHasSmartboard(Boolean hasSmartboard) {
        this.hasSmartboard = hasSmartboard;
    }

    public Boolean getHasCamera() {
        return hasCamera;
    }

    public void setHasCamera(Boolean hasCamera) {
        this.hasCamera = hasCamera;
    }

    public Boolean getHasPodiumWithPc() {
        return hasPodiumWithPc;
    }

    public void setHasPodiumWithPc(Boolean hasPodiumWithPc) {
        this.hasPodiumWithPc = hasPodiumWithPc;
    }

    public Boolean getHasPodium() {
        return hasPodium;
    }

    public void setHasPodium(Boolean hasPodium) {
        this.hasPodium = hasPodium;
    }

    public Boolean getHasWhiteboard() {
        return hasWhiteboard;
    }

    public void setHasWhiteboard(Boolean hasWhiteboard) {
        this.hasWhiteboard = hasWhiteboard;
    }

    public Boolean getHasClock() {
        return hasClock;
    }

    public void setHasClock(Boolean hasClock) {
        this.hasClock = hasClock;
    }

    public Boolean getHasLectureChairs() {
        return hasLectureChairs;
    }

    public void setHasLectureChairs(Boolean hasLectureChairs) {
        this.hasLectureChairs = hasLectureChairs;
    }

    public Boolean getHasLectureDesks() {
        return hasLectureDesks;
    }

    public void setHasLectureDesks(Boolean hasLectureDesks) {
        this.hasLectureDesks = hasLectureDesks;
    }

    public Boolean getHasSpeakers() {
        return hasSpeakers;
    }

    public void setHasSpeakers(Boolean hasSpeakers) {
        this.hasSpeakers = hasSpeakers;
    }

    public Boolean getHasWifi() {
        return hasWifi;
    }

    public void setHasWifi(Boolean hasWifi) {
        this.hasWifi = hasWifi;
    }

    public Boolean getHasPowerOutlets() {
        return hasPowerOutlets;
    }

    public void setHasPowerOutlets(Boolean hasPowerOutlets) {
        this.hasPowerOutlets = hasPowerOutlets;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, AvailabilityWindow> getAvailabilityWindows() {
        return availabilityWindows;
    }

    public void setAvailabilityWindows(Map<String, AvailabilityWindow> availabilityWindows) {
        this.availabilityWindows = availabilityWindows;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getAllowBookings() {
        return allowBookings;
    }

    public void setAllowBookings(Boolean allowBookings) {
        this.allowBookings = allowBookings;
    }

    public Boolean getAllowRequests() {
        return allowRequests;
    }

    public void setAllowRequests(Boolean allowRequests) {
        this.allowRequests = allowRequests;
    }
}