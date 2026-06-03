import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/modern_widgets.dart';
import '../../blocs/chat/chat_bloc.dart';
import '../../../domain/entities/chat_message.dart';
import '../../../core/di/injection.dart';

class ChatPage extends StatefulWidget {
  final int partnerId;
  final String partnerName;
  final int requestId;

  const ChatPage({
    super.key,
    required this.partnerId,
    required this.partnerName,
    required this.requestId,
  });

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => sl<ChatBloc>()
        ..add(StartChatPolling(partnerId: widget.partnerId, requestId: widget.requestId)),
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
          elevation: 0,
          leading: IconButton(
            icon: Icon(LucideIcons.arrowRight, color: Theme.of(context).appBarTheme.foregroundColor),
            onPressed: () => Navigator.pop(context),
          ),
          title: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  widget.partnerName.isNotEmpty ? widget.partnerName[0] : 'U',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.partnerName,
                      style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'محادثة الطلب #${widget.requestId}',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textDisabled, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: BlocConsumer<ChatBloc, ChatState>(
                listener: (context, state) {
                  if (state is ChatMessagesLoaded) {
                    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
                  }
                  if (state is ChatError) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(state.message),
                        backgroundColor: Colors.red.shade700,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                builder: (context, state) {
                  if (state is ChatLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state is ChatError) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.wifi_off_rounded, size: 48, color: Colors.grey),
                          const SizedBox(height: 12),
                          Text(state.message, textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => context.read<ChatBloc>().add(
                              StartChatPolling(partnerId: widget.partnerId, requestId: widget.requestId),
                            ),
                            child: const Text('إعادة المحاولة'),
                          ),
                        ],
                      ),
                    );
                  }
                  if (state is ChatMessagesLoaded) {
                    if (state.messages.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.messageSquare, size: 48, color: AppColors.textDisabled.withValues(alpha: 0.3)),
                            const SizedBox(height: 16),
                            Text('لا توجد رسائل بعد', style: AppTypography.bodyMedium.copyWith(color: AppColors.textDisabled)),
                          ],
                        ),
                      );
                    }
                    return ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(20),
                      itemCount: state.messages.length,
                      itemBuilder: (context, index) {
                        final message = state.messages[index];
                        final isMe = message.senderId != widget.partnerId;
                        return _buildMessageBubble(message, isMe);
                      },
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            _buildInputArea(context),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : Theme.of(context).cardColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isMe ? 20 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: AppTypography.bodyMedium.copyWith(
                color: isMe ? Colors.white : Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${message.createdAt.hour}:${message.createdAt.minute.toString().padLeft(2, '0')}',
              style: AppTypography.bodySmall.copyWith(
                color: isMe ? Colors.white70 : AppColors.textDisabled,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(top: BorderSide(color: AppColors.borderColor.withValues(alpha: 0.5))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.borderColor),
              ),
              child: TextField(
                controller: _messageController,
                decoration: const InputDecoration(
                  hintText: 'اكتب رسالتك...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 16),
                ),
                maxLines: null,
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: AppColors.primary,
            radius: 24,
            child: IconButton(
              icon: const Icon(LucideIcons.send, color: Colors.white, size: 20),
              onPressed: () {
                if (_messageController.text.trim().isNotEmpty) {
                  context.read<ChatBloc>().add(SendChatMessage(
                    receiverId: widget.partnerId,
                    content: _messageController.text.trim(),
                    requestId: widget.requestId,
                  ));
                  _messageController.clear();
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
