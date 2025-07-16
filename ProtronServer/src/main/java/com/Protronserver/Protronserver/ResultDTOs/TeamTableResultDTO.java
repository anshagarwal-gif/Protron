package com.Protronserver.Protronserver.ResultDTOs;

import java.util.Date;

public class TeamTableResultDTO {

    private Long userId;
    private String name;
    private String empCode;
    private String email;
    private String mobilePhone;
    private String city;
    private String state;
    private String country;
    private String cost;
    private Date dateOfJoining;
    private String status;

    public TeamTableResultDTO(Long userId, String name, String empCode, String email, String mobilePhone, String city,
                            String state, String country, String cost, Date dateOfJoining, String status) {
        this.userId = userId;
        this.name = name;
        this.empCode = empCode;
        this.email = email;
        this.mobilePhone = mobilePhone;
        this.city = city;
        this.state = state;
        this.country = country;
        this.cost = cost;
        this.dateOfJoining = dateOfJoining;
        this.status = status;
    }

    // Getters and setters


    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobilePhone() { return mobilePhone; }
    public void setMobilePhone(String mobilePhone) { this.mobilePhone = mobilePhone; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public Date getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(Date dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

}
