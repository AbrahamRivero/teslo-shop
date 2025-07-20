/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Order } from './entities';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Create a new order' })
  @ApiCreatedResponse({
    description: 'Order created successfully',
    type: Order,
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiBearerAuth()
  @Post()
  @Auth()
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: User) {
    return this.orderService.create(createOrderDto, user);
  }

  @ApiOperation({ summary: 'Get all orders' })
  @ApiOkResponse({ description: 'Products found', type: [Order] })
  @ApiNotFoundResponse({ description: 'Products not found' })
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.orderService.findAll(paginationDto);
  }

  @ApiOperation({ summary: 'Get all orders for a specific user' })
  @ApiOkResponse({ description: 'Orders found', type: [Order] })
  @ApiNotFoundResponse({ description: 'Orders not found' })
  @Get('user-orders')
  findUserOrders(@Query() paginationDto: PaginationDto, @GetUser() user: User) {
    return this.orderService.findUserOrders(paginationDto, user.id);
  }

  @ApiOperation({ summary: 'Get a order by id' })
  @ApiOkResponse({ description: 'Order found', type: Order })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a order' })
  @ApiOkResponse({ description: 'Order updated', type: Order })
  @ApiBody({ type: UpdateOrderDto })
  @ApiBearerAuth()
  @Patch(':id')
  @Auth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser() user: User,
  ) {
    return this.orderService.update(id, updateOrderDto, user);
  }

  @ApiOperation({ summary: 'Delete a order' })
  @ApiOkResponse({ description: 'Order deleted' })
  @ApiBearerAuth()
  @Delete(':id')
  @Auth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.remove(id);
  }
}
