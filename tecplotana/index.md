# Tecplot后处理函数式


#Plot Equations

## Tecplot

{{< admonition tip "对于 Visit导出数据" false >}}
若要使用Visit导出的三维数据求ddx,ddy,ddz，则必须先在Visit中对场切块，否则导出的坐标格式为I,J,K。
{{< /admonition >}}

### Q准则

```tecplot
{Q}=-1/2*((ddx(v4))**2+(ddy(v5))**2+(ddz(v6))**2)-ddy(v4)*ddx(v5)-ddz(v4)*ddx(v6)-ddz(v5)*ddy(v6)
```

### Liutex

```tecplot
{B2}=1/2*((ddy(v4)-ddx(v5))**2+(ddz(v4)-ddx(v6))**2+(ddz(v5)-ddy(v6))**2)
{A2}=(ddx(v4))**2+1/2*(ddy(v6)+ddz(v5))**2+(ddy(v5))**2+1/2*(ddz(v4)+ddx(v6))**2+(ddz(v6))**2+1/2*(ddx(v5)+ddy(v4))**2
{Liutex}={B2}/({A2}+{B2})
```

## Visit

### TKE

```visit
TKE=0.5*(VAR_U-MEAN_U^2+VAR_V-MEAN_V^2+VAR_W-MEAN_W^2)
```

### u’u’/Uc^2

```visit
u_var=(VAR_U-MEAN_U^2)/Uc^2(8.390755 for Circular 2.89668)
u_var=(VAR_U-MEAN_U^2)/8.390755
```


