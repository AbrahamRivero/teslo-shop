<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

#Teslo API

1. Clonar proyecto
2. ```yarn install```
3. Clonar el archivo ````.env.template``` y renombrarlo a ```.env```
4. Cambiar las variables de entorno
5. Levantar la base de datos
```docker-compose up -d```
6. Levantar: ```yarn run start:dev```
7. Ejecutar SEED
```http://localhost:3000/api/seed```

## Documentación de Funcionalidades del Panel de Administración de Órdenes

Este documento detalla la implementación de nuevas funcionalidades en el módulo de órdenes para soportar un panel de administración en el frontend. El objetivo principal fue proporcionar métricas clave, tendencias de crecimiento/decrecimiento y listados de los elementos más relevantes (usuarios y productos) basados en órdenes completadas.

### 1. Requisitos Iniciales y Ajustes

La idea original fue desarrollar un resumen de órdenes con los siguientes indicadores y listados:

*   **Periodos**: Órdenes de la última semana, dos semanas, mes, trimestre o año.
*   **Indicadores Clave**: Ingresos totales, valor promedio por orden, total de productos vendidos, cantidad de usuarios que completaron una orden.
*   **Comparación de Tendencia**: Comparación de los 4 indicadores con el valor de un periodo anterior equivalente.
*   **Listado Top 10 Usuarios**: Usuarios con más órdenes completadas en un periodo.
*   **Listado Top 10 Productos**: Productos más solicitados en órdenes completadas en un periodo.

Durante el desarrollo, se realizaron los siguientes ajustes y clarificaciones:

*   **Cálculo de Tendencia**: Se especificó que la comparación de los indicadores debería retornar el **porcentaje de crecimiento o decrecimiento** (`% de cambio`) en lugar de solo los valores absolutos del periodo anterior.
*   **Gestión de Crecimiento desde Cero**: Se afinó la lógica para el cálculo de porcentaje de cambio cuando el valor del periodo anterior es cero, para retornar `100%` en lugar de `"Infinity"`.
*   **Detalle de Órdenes en Resumen**: Se añadió el requisito de retornar la lista detallada de las órdenes del periodo actual dentro del endpoint de resumen del panel.

### 2. Estructura de la Solución

Para cumplir con estos requisitos, se adoptó un diseño modular, siguiendo las mejores prácticas de arquitectura de NestJS y TypeORM.

#### 2.1. `src/order/dto/order-stats.dto.ts`

Se creó un nuevo Data Transfer Object (`DTO`) para manejar los parámetros de entrada para las consultas de estadísticas del panel. Esto permite una validación y tipado claro de los parámetros de consulta.

```typescript
// src/order/dto/order-stats.dto.ts
import { IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderStatsDto {
  @ApiPropertyOptional({
    description: 'Period for statistics',
    enum: ['week', 'two-weeks', 'month', 'quarter', 'year'],
  })
  @IsOptional()
  @IsIn(['week', 'two-weeks', 'month', 'quarter', 'year'])
  period?: 'week' | 'two-weeks' | 'month' | 'quarter' | 'year';

  @ApiPropertyOptional({
    description: 'Start date for custom period (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom period (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

#### 2.2. `src/order/order.controller.ts`

Se agregaron tres nuevos endpoints modulares al `OrderController` para manejar las diferentes solicitudes del panel de administración, cada uno con su propósito específico y protegidos por autenticación (`@Auth()`).

*   **`GET /orders/dashboard/summary`**: Para obtener las métricas resumidas y sus tendencias.
*   **`GET /orders/dashboard/top-users`**: Para obtener la lista de los 10 usuarios con más órdenes.
*   **`GET /orders/dashboard/top-products`**: Para obtener la lista de los 10 productos más vendidos.

Se incluyeron decoradores de Swagger (`@ApiOperation`, `@ApiOkResponse`, `@ApiBadRequestResponse`, `@ApiBearerAuth`) para documentar claramente la API.

```typescript
// src/order/order.controller.ts (extracto de los nuevos endpoints)
// ... existing imports ...
import { OrderStatsDto } from './dto/order-stats.dto';
// ... existing code ...

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ... existing endpoints ...

  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  @ApiOkResponse({ description: 'Dashboard summary found' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiBearerAuth()
  @Get('dashboard/summary')
  @Auth()
  getDashboardSummary(@Query() orderStatsDto: OrderStatsDto) {
    return this.orderService.getDashboardSummary(orderStatsDto);
  }

  @ApiOperation({ summary: 'Get top 10 users by completed orders' })
  @ApiOkResponse({ description: 'Top users found' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiBearerAuth()
  @Get('dashboard/top-users')
  @Auth()
  getTopUsersByOrders(@Query() orderStatsDto: OrderStatsDto) {
    return this.orderService.getTopUsersByOrders(orderStatsDto);
  }

  @ApiOperation({ summary: 'Get top 10 products by completed orders' })
  @ApiOkResponse({ description: 'Top products found' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiBearerAuth()
  @Get('dashboard/top-products')
  @Auth()
  getTopProductsByOrders(@Query() orderStatsDto: OrderStatsDto) {
    return this.orderService.getTopProductsByOrders(orderStatsDto);
  }

  // ... existing endpoints ...
}
```

#### 2.3. `src/order/order.service.ts`

Aquí se implementó la lógica de negocio central, utilizando `TypeORM QueryBuilder` para consultas eficientes y manejando la lógica de fechas y cálculos.

##### **`private calculateDateRanges(orderStatsDto: OrderStatsDto)`**

Función auxiliar que calcula los rangos de fechas (`startDate`, `endDate`) para el periodo actual y para el periodo de comparación. Soporta periodos predefinidos (`week`, `month`, etc.) y rangos de fechas personalizados.

```typescript
// src/order/order.service.ts (extracto)
// ... existing code ...

  private calculateDateRanges(orderStatsDto: OrderStatsDto) {
    const { period, startDate, endDate } = orderStatsDto;
    let currentStartDate: Date;
    let currentEndDate: Date = new Date(); // Today
    let comparisonStartDate: Date;
    let comparisonEndDate: Date;

    if (startDate && endDate) {
      currentStartDate = new Date(startDate);
      currentEndDate = new Date(endDate);

      const diffTime = Math.abs(
        currentEndDate.getTime() - currentStartDate.getTime(),
      );

      comparisonEndDate = new Date(currentStartDate);
      comparisonEndDate.setDate(currentStartDate.getDate() - 1);
      comparisonStartDate = new Date(comparisonEndDate.getTime() - diffTime);
    } else {
      switch (period) {
        case 'week':
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setDate(currentEndDate.getDate() - 7);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 7);
          break;
        case 'two-weeks':
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setDate(currentEndDate.getDate() - 14);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 14);
          break;
        case 'month':
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setMonth(currentEndDate.getMonth() - 1);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 1);
          break;
        case 'quarter':
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setMonth(currentEndDate.getMonth() - 3);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setMonth(comparisonEndDate.getMonth() - 3);
          break;
        case 'year':
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setFullYear(currentEndDate.getFullYear() - 1);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setFullYear(comparisonEndDate.getFullYear() - 1);
          break;
        default:
          // Default to last week if no period or dates are provided
          currentStartDate = new Date(currentEndDate);
          currentStartDate.setDate(currentEndDate.getDate() - 7);
          comparisonEndDate = new Date(currentStartDate);
          comparisonEndDate.setDate(currentStartDate.getDate() - 1);
          comparisonStartDate = new Date(comparisonEndDate);
          comparisonStartDate.setDate(comparisonEndDate.getDate() - 7);
          break;
      }
    }

    return {
      current: { startDate: currentStartDate, endDate: currentEndDate },
      comparison: { startDate: comparisonStartDate, endDate: comparisonEndDate },
    };
  }
// ... existing code ...
```

##### **`private calculatePercentageChange(currentValue: number, previousValue: number): number | string`**

Función auxiliar para calcular el porcentaje de cambio, con manejo especial para la división por cero:

*   Si ambos valores son `0`, retorna `0`.
*   Si `previousValue` es `0` y `currentValue` es `> 0`, retorna `100` (100% de crecimiento desde cero).
*   En cualquier otro caso, realiza el cálculo estándar `((currentValue - previousValue) / previousValue) * 100`.

```typescript
// src/order/order.service.ts (extracto)
// ... existing code ...

  private calculatePercentageChange(currentValue: number, previousValue: number): number | string {
    if (previousValue === 0) {
      if (currentValue === 0) {
        return 0; // No change if both are zero
      } else {
        return 100; // Return 100% for growth from zero
      }
    } else {
      return ((currentValue - previousValue) / previousValue) * 100;
    }
  }
}
```

##### **`async getDashboardSummary(orderStatsDto: OrderStatsDto)`**

Este método es el corazón del resumen del panel.

1.  Determina los rangos de fechas para el periodo actual y de comparación usando `calculateDateRanges`.
2.  Define una función interna `getCurrentPeriodStats` que:
    *   Realiza una consulta con `TypeORM QueryBuilder` para obtener órdenes `completed` dentro de un rango de fechas.
    *   **Importante**: Se añadió `leftJoinAndSelect('order.user', 'user')` y `leftJoinAndSelect('product.images', 'productImage')` para cargar explícitamente las relaciones `user` y `product.images`, esenciales para evitar errores `TypeError` y asegurar que los detalles de los productos, incluyendo sus imágenes, se retornen correctamente.
    *   Calcula las métricas (`totalOrders`, `totalRevenue`, `averageOrderValue`, `totalProductsSold`, `uniqueUsers`).
    *   Retorna tanto las estadísticas como la lista de `orders` (`orders`).
3.  Llama a `getCurrentPeriodStats` para el periodo actual y de comparación.
4.  Calcula los `percentageChanges` para cada métrica utilizando `calculatePercentageChange`.
5.  Mapea las órdenes del periodo actual (`rawCurrentOrders`) para enriquecer los `orderItems` con los detalles completos del `product` (similar a `findAll`).
6.  Retorna un objeto que incluye:
    *   `currentPeriod`: Estadísticas del periodo actual.
    *   `comparisonPeriod`: Estadísticas del periodo de comparación.
    *   `percentageChanges`: Porcentajes de cambio para cada métrica.
    *   `currentPeriodOrders`: Lista detallada de órdenes para el periodo actual.

```typescript
// src/order/order.service.ts (extracto)
// ... existing code ...

  async getDashboardSummary(orderStatsDto: OrderStatsDto) {
    try {
      const { current, comparison } = this.calculateDateRanges(orderStatsDto);

      const getCurrentPeriodStats = async (start: Date, end: Date) => {
        const query = this.orderRepository.createQueryBuilder('order');

        const orders = await query
          .leftJoinAndSelect('order.orderItems', 'orderItem')
          .leftJoinAndSelect('orderItem.product', 'product')
          .leftJoinAndSelect('product.images', 'productImage') // Load product images
          .leftJoinAndSelect('order.user', 'user')
          .where('order.orderStatus = :status', { status: 'completed' })
          .andWhere('order.createdAt BETWEEN :start AND :end', {
            start,
            end,
          })
          .getMany();

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce(
          (sum, order) => sum + order.total,
          0,
        );
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalProductsSold = orders.reduce(
          (sum, order) =>
            sum +
            order.orderItems.reduce(
              (itemSum, item) => itemSum + item.quantity,
              0,
            ),
          0,
        );
        const uniqueUsers = new Set(orders.map((order) => order.user.id)).size;

        return {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          totalProductsSold,
          uniqueUsers,
          orders, // Include the orders list
        };
      };

      const currentPeriodStatsResult = await getCurrentPeriodStats(
        current.startDate,
        current.endDate,
      );
      const comparisonPeriodStats = await getCurrentPeriodStats(
        comparison.startDate,
        comparison.endDate,
      );

      const { orders: rawCurrentOrders, ...currentPeriodStats } =
        currentPeriodStatsResult;

      const detailedCurrentOrders = rawCurrentOrders.map(
        ({ orderItems, ...rest }) => ({
          ...rest,
          orderItems: orderItems?.map((item) => ({
            ...item,
            product: {
              id: item.product.id,
              title: item.product.title,
              stock: item.product.stock,
              price: item.product.price,
              images: item.product.images?.map((image) => image.url),
            },
          })),
        }),
      );

      const percentageChanges = {
        totalOrders: this.calculatePercentageChange(
          currentPeriodStats.totalOrders,
          comparisonPeriodStats.totalOrders,
        ),
        totalRevenue: this.calculatePercentageChange(
          currentPeriodStats.totalRevenue,
          comparisonPeriodStats.totalRevenue,
        ),
        averageOrderValue: this.calculatePercentageChange(
          currentPeriodStats.averageOrderValue,
          comparisonPeriodStats.averageOrderValue,
        ),
        totalProductsSold: this.calculatePercentageChange(
          currentPeriodStats.totalProductsSold,
          comparisonPeriodStats.totalProductsSold,
        ),
        uniqueUsers: this.calculatePercentageChange(
          currentPeriodStats.uniqueUsers,
          comparisonPeriodStats.uniqueUsers,
        ),
      };

      return {
        currentPeriod: currentPeriodStats,
        comparisonPeriod: comparisonPeriodStats,
        percentageChanges,
        currentPeriodOrders: detailedCurrentOrders, // Add the detailed orders here
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

// ... existing code ...
```

##### **`async getTopUsersByOrders(orderStatsDto: OrderStatsDto)`**

Obtiene los 10 usuarios con más órdenes completadas en el periodo especificado por `orderStatsDto`.

*   Utiliza `calculateDateRanges` para determinar el periodo.
*   Realiza una consulta con `TypeORM QueryBuilder` para contar órdenes por usuario, uniendo con la tabla `users` para obtener detalles del usuario.
*   Ordena por el conteo de órdenes de forma descendente y limita a 10 resultados.
*   **Corrección**: Se corrigió el error `column "ordercount" does not exist` al encerrar el alias `orderCount` entre comillas dobles en la cláusula `orderBy` (`.orderBy('"orderCount"', 'DESC')`) para compatibilidad con la sensibilidad a mayúsculas/minúsculas de PostgreSQL.

```typescript
// src/order/order.service.ts (extracto)
// ... existing code ...

  async getTopUsersByOrders(orderStatsDto: OrderStatsDto) {
    try {
      const { current } = this.calculateDateRanges(orderStatsDto);
      const { startDate, endDate } = current;

      const topUsers = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.user.id', 'userId')
        .addSelect('user.email', 'userEmail') // Assuming user.email is accessible via the relation
        .addSelect('COUNT(order.id)', 'orderCount')
        .innerJoin('order.user', 'user') // Join with user entity to get user details
        .where('order.orderStatus = :status', { status: 'completed' })
        .andWhere('order.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('order.user.id')
        .addGroupBy('user.email') // Group by user email as well if displaying it
        .orderBy('"orderCount"', 'DESC')
        .limit(10)
        .getRawMany();

      return topUsers;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

// ... existing code ...
```

##### **`async getTopProductsByOrders(orderStatsDto: OrderStatsDto)`**

Obtiene los 10 productos más vendidos (en cantidad) en órdenes completadas para el periodo especificado por `orderStatsDto`.

*   Utiliza `calculateDateRanges` para determinar el periodo.
*   Realiza una consulta con `TypeORM QueryBuilder` uniendo `OrderItem` con `Order` y `Product` para sumar las cantidades vendidas por producto.
*   Ordena por la cantidad total vendida de forma descendente y limita a 10 resultados.
*   **Corrección**: Se corrigió el error `column "totalquantitysold" does not exist` al encerrar el alias `totalQuantitySold` entre comillas dobles en la cláusula `orderBy` (`.orderBy('"totalQuantitySold"', 'DESC')`).

```typescript
// src/order/order.service.ts (extracto)
// ... existing code ...

  async getTopProductsByOrders(orderStatsDto: OrderStatsDto) {
    try {
      const { current } = this.calculateDateRanges(orderStatsDto);
      const { startDate, endDate } = current;

      const topProducts = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('product.id', 'productId')
        .addSelect('product.title', 'productTitle')
        .addSelect('SUM(orderItem.quantity)', 'totalQuantitySold')
        .leftJoin('orderItem.order', 'order')
        .leftJoin('orderItem.product', 'product')
        .where('order.orderStatus = :status', { status: 'completed' })
        .andWhere('order.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('product.id')
        .addGroupBy('product.title')
        .orderBy('"totalQuantitySold"', 'DESC')
        .limit(10)
        .getRawMany();

      return topProducts;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

// ... existing code ...
```

### 3. Errores Resueltos Durante el Proceso

Durante la implementación, se identificaron y corrigieron los siguientes errores:

*   **Errores de Linter en `OrderStatsDto`**: Se resolvieron problemas de formato y saltos de línea al crear el DTO, aunque algunos errores de final de línea pueden ser específicos del entorno de desarrollo.
*   **`QueryFailedError: column "ordercount" does not exist`**: Este error, que afectaba a `getTopUsersByOrders` y `getTopProductsByOrders`, fue causado por la sensibilidad a mayúsculas/minúsculas de los alias de columna en PostgreSQL. Se solucionó encerrando los alias entre comillas dobles en las cláusulas `orderBy` (`"orderCount"`, `"totalQuantitySold"`).
*   **`TypeError: Cannot read properties of undefined (reading 'id')`**: Ocurría en `getDashboardSummary` al intentar acceder a `order.user.id`. Se resolvió añadiendo `leftJoinAndSelect('order.user', 'user')` a la consulta de `TypeORM QueryBuilder` dentro de `getCurrentPeriodStats` para asegurar que la relación `user` se cargara explícitamente.
*   **Porcentajes de Cambio `"Infinity"`**: Se corrigió la lógica en `calculatePercentageChange` para retornar `100` en lugar de `"Infinity"` cuando el valor anterior es cero y el actual es positivo, proporcionando una métrica más significativa para el dashboard.
*   **Imágenes de Productos no Retornadas**: Se solucionó añadiendo `leftJoinAndSelect('product.images', 'productImage')` a la consulta de `TypeORM QueryBuilder` dentro de `getCurrentPeriodStats`, asegurando que las imágenes de los productos se cargaran junto con los detalles de la orden.